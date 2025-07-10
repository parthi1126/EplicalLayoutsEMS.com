import os
import json
import base64
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from flask import Flask

app = Flask(__name__)

# Google Sheets Setup
scope = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets"
]

def validate_credentials_dict(creds_dict):
    """Validate the structure of the credentials dictionary"""
    required_keys = {
        'type': 'service_account',
        'project_id': str,
        'private_key_id': str,
        'private_key': str,
        'client_email': str,
        'client_id': str,
        'auth_uri': str,
        'token_uri': str,
        'auth_provider_x509_cert_url': str,
        'client_x509_cert_url': str
    }
    
    if not isinstance(creds_dict, dict):
        raise ValueError("Credentials must be a dictionary")
    
    if creds_dict.get('type') != 'service_account':
        raise ValueError("Credentials type must be 'service_account'")
    
    for key, expected_type in required_keys.items():
        if key not in creds_dict:
            raise ValueError(f"Missing required key: {key}")
        if not isinstance(creds_dict[key], expected_type):
            raise ValueError(f"Invalid type for {key}, expected {expected_type}")

def load_google_credentials():
    credentials_json = os.environ.get("GOOGLE_SHEETS_CREDENTIALS_JSON")
    
    if not credentials_json:
        raise ValueError("GOOGLE_SHEETS_CREDENTIALS_JSON environment variable not set")
    
    # Try direct JSON parsing first
    try:
        creds_dict = json.loads(credentials_json)
        validate_credentials_dict(creds_dict)
        return creds_dict
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Direct JSON parse failed: {str(e)}")
    
    # Try cleaning the string (remove newlines, extra spaces)
    try:
        cleaned = ' '.join(credentials_json.strip().split())
        creds_dict = json.loads(cleaned)
        validate_credentials_dict(creds_dict)
        return creds_dict
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Cleaned JSON parse failed: {str(e)}")
    
    # Try base64 decoding
    try:
        # Add padding if needed
        padding = len(credentials_json) % 4
        if padding:
            credentials_json += '=' * (4 - padding)
        decoded = base64.b64decode(credentials_json).decode('utf-8')
        creds_dict = json.loads(decoded)
        validate_credentials_dict(creds_dict)
        return creds_dict
    except Exception as e:
        raise ValueError(f"Failed to parse valid credentials after multiple attempts: {str(e)}")

try:
    print("Attempting to load Google credentials...")
    creds_dict = load_google_credentials()
    print("Successfully parsed and validated credentials")
    
    print("Initializing Google Sheets client...")
    creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
    client = gspread.authorize(creds)
    print("Successfully authorized with Google Sheets API")

except Exception as e:
    print(f"FATAL ERROR: {str(e)}")
    print("Please verify your GOOGLE_SHEETS_CREDENTIALS_JSON environment variable")
    print("It should contain either:")
    print("1. The full contents of your service account JSON file, or")
    print("2. A base64 encoded version of that file")
    raise

# Rest of your application code...

# Helper functions
# Helper functions (unchanged)
def get_column_index(worksheet, header_name):
    try:
        headers = worksheet.row_values(1)
        for idx, header in enumerate(headers, start=1):
            if header_name.lower() in header.lower():
                return idx
        return None
    except Exception as e:
        print(f"Error getting column index: {e}")
        return None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            flash('Please login to access this page', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Admin required decorators
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session or session.get('role') != 'admin':
            flash('Admin access required', 'danger')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function
# Login page
@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '').strip()
        users = sheet4.get_all_records(head=3)
        found_email = False
        found_password = False
        for idx, user in enumerate(users):
            if str(user.get('EmployeeMailId', '')).strip().lower() == email:
                found_email = True
                if str(user.get('Password', '')).strip() == password:
                    found_password = True
                    session.clear()
                    session['email'] = email
                    session['fullname'] = user.get('FullName', '')
                    session['role'] = user.get('Role', 'employee').lower()
                    # OTP/2FA logic
                    secret = user.get('SecretKey', '').strip() if 'SecretKey' in user else ''
                    if not secret:
                        secret = pyotp.random_base32()
                        # Update the secret in the sheet (SecretKey column)
                        # Find the column index for SecretKey
                        all_headers = sheet4.row_values(3)
                        if 'SecretKey' in all_headers:
                            secret_col = all_headers.index('SecretKey') + 1
                            sheet4.update_cell(idx + 4, secret_col, secret)
                    session['secret'] = secret
                    session.modified = True
                    return redirect(url_for('otp'))
                break
        if not found_email:
            flash('Email not found!', 'danger')
        elif not found_password:
            flash('Incorrect password!', 'danger')
        return redirect(url_for('login'))
    return render_template('login.html')

# OTP Verification Route
@app.route('/otp', methods=['GET', 'POST'])
def otp():
    if 'email' not in session or 'secret' not in session:
        return redirect(url_for('login'))
    if request.method == 'POST':
        otp_entered = request.form.get('otp', '')
        if pyotp.TOTP(session['secret']).verify(otp_entered):
            # OTP correct, route by role
            role = session.get('role', '').strip().lower()
            session['logged_in'] = True
            session.modified = True
            if role == 'admin':
                return redirect(url_for('admindashboard'))
            else:
                return redirect(url_for('empdashboard'))
        else:
            # OTP incorrect, show error and keep on OTP page
            return render_template('otp.html', error='Invalid OTP. Please try again.', email=session['email'], name=session.get('fullname', ''), qr_base64=session.get('qr_base64', ''))
    # Generate QR code for GET request
    totp = pyotp.TOTP(session['secret'])
    uri = totp.provisioning_uri(name=session['email'], issuer_name="Employee Portal")
    qr_img = qrcode.make(uri)
    buffered = BytesIO()
    qr_img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    session['qr_base64'] = qr_base64
    session.modified = True
    return render_template('otp.html', email=session['email'], name=session.get('fullname', ''), qr_base64=qr_base64)

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('login'))

# Dashboard routes
@app.route('/empdashboard')
@login_required
def empdashboard():
    return render_template('empdashboard.html',fullname=session.get('fullname', 'Boss'))

@app.route('/admindashboard')
@admin_required
def admindashboard():
    try:
        all_data = sheet3.get_all_values()
        
        stats = {
            'TotalEmployee': 0,
            'NewEmployee': 0,
            'UpcomingPublicHoliday': 'None',
            'TotalProjectComplete': 0,
            'totaladmin': 0,
            'PendingLeave': 0,
            'totalleave': 0
        }

        if len(all_data) >= 4:
            headers = all_data[2]
            values = all_data[3]
            stats.update({k.strip(): int(v) if str(v).isdigit() else v for k, v in zip(headers, values) if k})
            
    except Exception as e:
        print(f"Dashboard error: {e}")
    
    return render_template('admindashboard.html', stats=stats, fullname=session.get('fullname', 'Boss'))

# Employee management routes
@app.route('/showemployee')
@admin_required
def showemployee():
    data = sheet.get_all_values()
    headers = data[0] if data else []
    rows = data[1:] if len(data) > 1 else []
    return render_template('showemployee.html', headers=headers, datas=rows)

@app.route('/addemployee', methods=['GET', 'POST'])
@admin_required
def addemployee():
    if request.method == 'POST':
        try:
            new_row = [
                request.form['name'], 
                request.form['Email'], 
                request.form['phone'], 
                request.form['address'],
                request.form['EmployeeId'], 
                request.form['Designation'], 
                request.form['Department'],
                request.form['JoiningDate'], 
                request.form['EmploymentType'], 
                request.form['Role'],
                request.form.get('Salary', ''), 
                request.form['dob'], 
                request.form['gender'],
                request.form['password'], 
                "Active"
            ]

            existing_data = sheet.get_all_values()
            for row in existing_data[1:]:
                if len(row) > 4 and row[4] == new_row[4]:
                    return render_template("addemployee.html", error="❌ Employee ID already exists!")
                if len(row) > 1 and row[1] == new_row[1]:
                    return render_template("addemployee.html", error="❌ Email already exists!")

            sheet.append_row(new_row)
            return redirect(url_for('showemployee'))

        except Exception as e:
            return render_template("addemployee.html", error=str(e))

    return render_template("addemployee.html")

@app.route('/updateemployee/<id>', methods=['GET', 'POST'])
@admin_required
def updateemployee(id):
    data = sheet.get_all_values()
    headers = data[0]
    rows = data[1:]

    target_row = None
    for row in rows:
        if row[4] == id:
            target_row = row
            break

    if not target_row:
        return f"No employee found with ID {id}", 404

    return render_template('updateemployee.html', id=id, row=target_row, headers=headers)

@app.route('/block_employee/<int:id>', methods=['POST'])
@admin_required
def block_employee(id):
    data = sheet.get_all_values()
    if id >= len(data):
        return jsonify({"error": "Invalid ID"}), 400

    current_status = data[id][14] if len(data[id]) > 14 else "Active"
    new_status = "Blocked" if current_status != "Blocked" else "Active"
    sheet.update_cell(id + 1, 15, new_status)
    return jsonify({"success": True, "new_status": new_status})

@app.route('/delete/<int:id>')
@admin_required
def delete(id):
    sheet.delete_rows(id+1)
    return redirect(url_for('showemployee'))

# Leave management routes
@app.route('/leave')
@login_required
def leave():
    try:
        data = sheet1.get_all_values()[3:]
        return render_template('leave.html', leaves=data)
    except Exception as e:
        print(f"Error fetching leave data: {e}")
        flash("Error loading leave data", "error")
        return render_template('leave.html', leaves=[])

@app.route('/leave_ad')
@admin_required
def leave_ad():
    data = sheet1.get_all_values()
    headers = data[0] if data else []
    values = data[1:] if len(data) > 1 else []
    return render_template('leave_ad.html', leaves=values)

@app.route('/submit_leave_form', methods=['POST'])
@login_required
def submit_leave_form():
    try:
        from_date = request.form['frmdt']
        to_date = request.form['todt']
        leave_type = request.form['type']
        reason = request.form['description']

        from_dt = datetime.strptime(from_date, "%Y-%m-%d")
        to_dt = datetime.strptime(to_date, "%Y-%m-%d")
        total_days = (to_dt - from_dt).days + 1

        row_data = [
            session.get('fullname', 'Employee'),
            leave_type,
            from_date,
            to_date,
            str(total_days),
            reason,
            "Pending"
        ]

        sheet1.append_row(row_data)
        flash("Leave request submitted successfully!", "success")
        return redirect(url_for('leave'))

    except Exception as e:
        print(f"Error submitting leave: {e}")
        flash("Failed to submit leave request", "error")
        return redirect(url_for('leave'))

@app.route('/update-leave-status', methods=['POST'])
@admin_required
def update_leave_status():
    try:
        data = request.get_json()
        employee = data['employee']
        from_date = data['fromdate']
        to_date = data['todate']
        status = data['status']

        records = sheet1.get_all_values()
        
        for i in range(1, len(records)):
            row = records[i]
            if (len(row) >= 7 and 
                row[0].strip() == employee.strip() and 
                row[2].strip() == from_date.strip() and 
                row[3].strip() == to_date.strip()):
                
                sheet1.update_cell(i+1, 7, status)
                return jsonify({'success': True, 'message': 'Status updated successfully'})
        
        return jsonify({
            'success': False, 
            'message': 'Record not found',
            'debug': {
                'employee': employee,
                'from_date': from_date,
                'to_date': to_date,
                'status': status,
                'records_count': len(records)
            }
        }), 404

    except Exception as e:
        print(f"Error updating leave status: {str(e)}")
        return jsonify({
            'success': False, 
            'message': 'Server error',
            'error': str(e)
        }), 500

# Timesheet routes
@app.route('/time_emp', methods=['GET', 'POST'])
@login_required
def time_emp():
    EXPECTED_HEADERS = [
        'EmployeeId',
        'Employee',
        'Date',
        'Start Time',
        'End Time',
        'Project',
        'ProjectDetails',
        'Hours',
        'Status'
    ]

    if request.method == 'POST':
        action = request.form.get('action')
        task_id = int(request.form.get('task_id'))
        current_time = datetime.now().strftime('%H:%M:%S')

        if action == 'start':
            sheet5.update_cell(task_id, 4, current_time)
            sheet5.update_cell(task_id, 9, 'In Progress')

        elif action == 'complete':
            start_time = sheet5.cell(task_id, 4).value
            if start_time:
                try:
                    start_dt = datetime.strptime(start_time, '%H:%M:%S')
                    end_dt = datetime.strptime(current_time, '%H:%M:%S')
                    delta = end_dt - start_dt
                    hours = delta.seconds // 3600
                    minutes = (delta.seconds % 3600) // 60
                    hours_str = f"{hours}h {minutes}m"

                    sheet5.update_cell(task_id, 5, current_time)
                    sheet5.update_cell(task_id, 8, hours_str)
                    sheet5.update_cell(task_id, 9, 'Completed')
                except ValueError:
                    pass

    all_values = sheet5.get_all_values()[2:]
    records = []

    for i, row in enumerate(all_values, start=4):
        if len(row) >= len(EXPECTED_HEADERS):
            record = dict(zip(EXPECTED_HEADERS, row[:len(EXPECTED_HEADERS)]))
            record['row_id'] = i

            if record.get('Status', '').strip().lower() == 'in progress' and record.get('Start Time'):
                try:
                    start_time = datetime.strptime(record['Start Time'], '%H:%M:%S')
                    current_time = datetime.now()
                    delta = current_time - start_time
                    hours = delta.seconds // 3600
                    minutes = (delta.seconds % 3600) // 60
                    record['current_duration'] = f"{hours}h {minutes}m"
                except ValueError:
                    record['current_duration'] = "N/A"

            records.append(record)

    not_started = [r for r in records if r.get('Status', '').strip().lower() == 'not-started']
    in_progress = [r for r in records if r.get('Status', '').strip().lower() == 'in progress']
    completed = [r for r in records if r.get('Status', '').strip().lower() == 'completed']

    return render_template('time_emp.html',
                         not_started=not_started,
                         in_progress=in_progress,
                         completed=completed)

@app.route('/timeadmin', methods=['GET', 'POST'])
@admin_required
def timeadmin():
    message = None
    
    if request.method == 'POST':
        try:
            project = request.form['newProject']
            description = request.form['Projectdescription']
            emp_id = request.form['employeeid']
            emp_name = request.form['employeename']
            deadline = request.form['deadlineInput']

            today = datetime.now().strftime("%Y-%m-%d")
            start_time = datetime.now().strftime("%H:%M:%S")
            end_time = ""
            status = "In Progress"
            hours = ""

            new_row = [emp_id, emp_name, today, start_time, end_time, project, description, hours, status]
            sheet5.append_row(new_row)

            message = "✅ Project Assigned Successfully!"

        except Exception as e:
            message = f"❌ Error: {str(e)}"

    task_data = sheet5.get_all_values()
    headers = task_data[2] if len(task_data) > 2 else []
    rows = task_data[3:] if len(task_data) > 3 else []

    return render_template('timeadmin.html', message=message, headers=headers, rows=rows)

# Holiday routes
@app.route('/publicholiday')
@login_required
def publicholiday():
    return render_template('publicholiday.html')

@app.route('/api/holidays', methods=['GET'])
def get_holidays():
    try:
        holidays = sheet6.get_all_records()
        return jsonify(holidays)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/holidays', methods=['POST'])
@admin_required
def create_holiday():
    try:
        data = request.json
        next_id = max([h.get('id', 0) for h in sheet6.get_all_records()] or 0) + 1
        data['id'] = next_id
        sheet6.append_row([data['id'], data['name'], data['date'], data.get('country', '')])
        return jsonify(data), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/holidays/<int:holiday_id>', methods=['PUT'])
@admin_required
def update_holiday(holiday_id):
    try:
        data = request.json
        records = sheet6.get_all_records()
        for i, row in enumerate(records, start=2):
            if row.get('id') == holiday_id:
                sheet6.update_cell(i, 2, data['name'])
                sheet6.update_cell(i, 3, data['date'])
                sheet6.update_cell(i, 4, data.get('country', ''))
                return jsonify(data)
        return jsonify({'error': 'Holiday not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/holidays/<int:holiday_id>', methods=['DELETE'])
@admin_required
def delete_holiday(holiday_id):
    try:
        records = sheet6.get_all_records()
        for i, row in enumerate(records, start=2):
            if row.get('id') == holiday_id:
                sheet6.delete_row(i)
                return jsonify({'success': True})
        return jsonify({'error': 'Holiday not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Payslip routes
def get_payslip_sheet_data():
    try:
        all_data = payslip_sheet.get_all_values()
        
        if len(all_data) < 2:
            return []
            
        headers = [h.strip() for h in all_data[0]]
        records = []
        
        for i, row in enumerate(all_data[1:], start=2):
            if len(row) < len(headers):
                row += [''] * (len(headers) - len(row))
            
            record = dict(zip(headers, row))
            record['row_id'] = i
            
            if 'request' in record.get('Type', '').lower():
                record['Type'] = 'request'
            elif record.get('Status', '').lower() == 'fulfilled' and not record.get('Archived Date'):
                record['Type'] = 'active'
            elif record.get('Archived Date'):
                record['Type'] = 'archived'
            else:
                record['Type'] = 'unknown'
            
            records.append(record)
                
        return records
    except Exception as e:
        print(f"Error reading payslip sheet: {e}")
        return []

@app.route('/payslipmp', methods=['GET'])
@login_required
def employee_portal():
    try:
        data = get_payslip_sheet_data()
        available_files = [row for row in data if row.get('Status', '').lower() == 'fulfilled']
        return render_template('payslipmp.html', active_files=available_files)
    except Exception as e:
        flash('Error loading payslips. Please try again later.', 'error')
        print(f"Error in employee_portal: {e}")
        return render_template('payslimp.html', active_files=[])

@app.route('/request_payslip', methods=['POST', 'GET'])
@login_required
def request_payslip():
    try:
        employee_name = request.form.get('employee_name', '').strip()
        employee_id = request.form.get('employee_id', '').strip()
        month_year = request.form.get('month_year', '').strip()
        additional_notes = request.form.get('additional_notes', '').strip()
        
        if not all([employee_name, employee_id, month_year]):
            flash('Please fill all required fields!', 'error')
            return redirect(url_for('employee_portal'))

        if len(payslip_sheet.get_all_values()) < 1:
            initialize_sheet(payslip_sheet)
        
        request_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        new_row = [
            
            employee_name,
            employee_id,
            month_year,
            additional_notes,
            request_date,
            'Pending',
            '',
            '',
            '',
            ''
        ]
        payslip_sheet.append_row(new_row)
        
        flash('Payslip request submitted successfully!', 'success')
    except Exception as e:
        flash('Failed to submit request. Please try again.', 'error')
        print(f"Error in request_payslip: {e}")
    
    return redirect(url_for('employee_portal'))

def initialize_sheet(payslip_sheet):
    headers = [
        '',
        'Employee Name',
        'Employee ID',
        'Month-Year',
        'Additional Notes',
        'Request Date',
        'Status',
        'File Name',
        'Download Link',
        'Upload Date',
        'Archived Date'
    ]
    payslip_sheet.append_row(headers)

@app.route('/payslipad')
@admin_required
def payslipad():
    try:
        data = get_payslip_sheet_data()
        requests = [row for row in data if row.get('Type') == 'request' and 
                   row.get('Status', '').lower() == 'pending']
        active_files = [row for row in data if row.get('Type') == 'active']
        archived_files = [row for row in data if row.get('Type') == 'archived']
        
        return render_template('payslipad.html',
                            requests=requests,
                            active_files=active_files,
                            archived_files=archived_files)
    except Exception as e:
        flash('Error loading payslip portal. Please try again.', 'error')
        print(f"Error in payslipad: {e}")
        return render_template('payslipad.html', 
                            requests=[], 
                            active_files=[], 
                            archived_files=[])

@app.route('/payslip_upload', methods=['POST'])
@admin_required
def payslip_upload():
    temp_path = None
    try:
        credentials_json = os.environ.get("GOOGLE_SHEETS_CREDENTIALS_JSON")
        if credentials_json:
            creds_dict = json.loads(credentials_json)
            creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
            drive_service = build('drive', 'v3', credentials=creds)
        else:
            raise Exception("Google credentials not found for Drive API")
        
        employee_name = request.form.get('employee_name', '').strip()
        employee_id = request.form.get('employee_id', '').strip()
        month_year = request.form.get('month_year', '').strip()
        uploaded_file = request.files.get('file')
        request_id = request.form.get('request_id')
        
        if not all([employee_name, employee_id, month_year]) or not uploaded_file:
            flash('All fields are required!', 'error')
            return redirect(url_for('payslipad'))

        if not allowed_file(uploaded_file.filename):
            flash('Only PDF files are allowed!', 'error')
            return redirect(url_for('payslipad'))

        filename = secure_filename(f"{employee_name}{employee_id}{month_year}_payslip.pdf")
        temp_path = os.path.join(UPLOAD_FOLDER, filename)
        uploaded_file.save(temp_path)

        file_metadata = {
            'name': filename,
            'parents': [DRIVE_FOLDER_ID],
            'mimeType': 'application/pdf'
        }

        with open(temp_path, 'rb') as file:
            media = MediaFileUpload(temp_path, mimetype='application/pdf')
            uploaded = drive_service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id,webViewLink'
            ).execute()

        file_id = uploaded.get('id')
        download_link = f"https://drive.google.com/uc?export=download&id={file_id}"
        upload_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        if request_id and request_id.isdigit():
            payslip_sheet.update_cell(int(request_id), 7, 'Fulfilled')
            payslip_sheet.update_cell(int(request_id), 8, filename)
            payslip_sheet.update_cell(int(request_id), 9, download_link)
            payslip_sheet.update_cell(int(request_id), 10, upload_date)
        else:
            new_row = [
                'active',
                employee_name,
                employee_id,
                month_year,
                '',
                '',
                'Fulfilled',
                filename,
                download_link,
                upload_date,
                ''
            ]
            payslip_sheet.append_row(new_row)

        flash('Payslip uploaded successfully!', 'success')
    except Exception as e:
        flash(f'Error uploading file: {str(e)}', 'error')
        print(f"Error in payslip_upload: {e}")
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                print(f"Failed to delete temp file: {e}")
    
    return redirect(url_for('payslipad'))

@app.route('/payslip_archive/<int:row_id>')
@admin_required
def payslip_archive(row_id):
    try:
        row_data = payslip_sheet.row_values(row_id)
        if not row_data or len(row_data) < 11:
            flash('Invalid row selected for archiving', 'error')
            return redirect(url_for('payslipad'))

        if row_data[6].lower() != 'fulfilled':
            flash('Only fulfilled payslips can be archived', 'error')
            return redirect(url_for('payslipad'))

        archive_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        payslip_sheet.update_cell(row_id, 1, 'archived')
        payslip_sheet.update_cell(row_id, 11, archive_date)
        
        flash('Payslip archived successfully!', 'success')
    except Exception as e:
        flash(f'Error archiving payslip: {str(e)}', 'error')
        print(f"Error in payslip_archive: {e}")
    
    return redirect(url_for('payslipad'))

# Other routes


@app.route('/profile')
@login_required
def profile():
    return render_template('profile.html')
