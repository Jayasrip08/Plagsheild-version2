import React, { useState, useEffect } from 'react';
import api, { logout } from './api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  User, 
  LogOut, 
  AlertTriangle, 
  Download, 
  Filter, 
  RotateCcw, 
  UserPlus, 
  FileSpreadsheet, 
  CheckCircle2, 
  School 
} from 'lucide-react';
import ProfilePage from './ProfilePage';

export default function CollegePortal({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [studentSubTab, setStudentSubTab] = useState('roster'); // 'roster', 'single', 'csv'
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Student List & Adds
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [newStudent, setNewStudent] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', department: '' });
  const [addingStudent, setAddingStudent] = useState(false);
  
  // CSV Upload State
  const [csvFile, setCsvFile] = useState(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [csvResult, setCsvResult] = useState(null);

  // Submissions Log & Filters
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [filters, setFilters] = useState({ department: '', min_similarity: '', max_similarity: '', start_date: '', end_date: '' });

  useEffect(() => {
    fetchDashboardStats();
    fetchStudents();
    fetchSubmissions();
  }, []);

  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('colleges/dashboard/');
      setStats(res.data);
    } catch (e) {
      console.error("Failed to load dashboard metrics", e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await api.get('accounts/students/');
      setStudents(res.data);
    } catch (e) {
      console.error("Failed to fetch students list", e);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      // Build query parameters
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.min_similarity) params.min_similarity = filters.min_similarity;
      if (filters.max_similarity) params.max_similarity = filters.max_similarity;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const res = await api.get('orders/', { params });
      setSubmissions(res.data);
    } catch (e) {
      console.error("Failed to load submissions", e);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleSingleStudentSubmit = async (e) => {
    e.preventDefault();
    setAddingStudent(true);
    try {
      await api.post('accounts/students/create/', newStudent);
      alert(`Student '${newStudent.username}' registered successfully!`);
      setNewStudent({ username: '', email: '', password: '', first_name: '', last_name: '', department: '' });
      fetchStudents();
    } catch (e) {
      console.error("Failed to register student", e);
      alert(e.response?.data?.error || "Error adding student. Make sure username/email are unique.");
    } finally {
      setAddingStudent(false);
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    setUploadingCsv(true);
    setCsvResult(null);

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const res = await api.post('colleges/upload-students/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCsvResult(res.data);
      setCsvFile(null);
      fetchStudents();
    } catch (e) {
      console.error("Failed to process CSV file", e);
      alert("Error processing CSV. Check format columns.");
    } finally {
      setUploadingCsv(false);
    }
  };

  const triggerExport = () => {
    if (submissions.length === 0) {
      alert("No submissions matching filters to export.");
      return;
    }
    
    // Construct CSV text
    const headers = ['Order ID', 'Username', 'Email', 'Document Name', 'Date Submitted', 'Department', 'Word Count', 'Similarity Score', 'Status'];
    const rows = submissions.map(s => [
      s.id,
      s.user_details?.username,
      s.user_details?.email,
      s.document.split('/').pop(),
      new Date(s.created_at).toLocaleDateString(),
      s.department || 'General',
      s.word_count,
      s.similarity_score !== null ? `${s.similarity_score}%` : 'Pending',
      s.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `submissions_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchSubmissions();
  };

  const handleFilterClear = () => {
    setFilters({ department: '', min_similarity: '', max_similarity: '', start_date: '', end_date: '' });
    // Fetch directly using empty filters
    api.get('orders/').then(res => setSubmissions(res.data));
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <School size={24} style={{ color: 'var(--primary)' }} />
          <span>College Admin</span>
        </div>
        <div className="sidebar-nav">
          <button 
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <LayoutDashboard size={18} />
            Dashboard Overview
          </button>
          <button 
            className={`nav-link ${activeTab === 'submissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('submissions')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <FileText size={18} />
            Submissions Audit Log
          </button>
          <button 
            className={`nav-link ${activeTab === 'students' && studentSubTab === 'directory' ? 'active' : ''}`}
            onClick={() => { setActiveTab('students'); setStudentSubTab('directory'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Users size={18} />
            Student Roster
          </button>
          <button 
            className={`nav-link ${activeTab === 'students' && studentSubTab === 'single' ? 'active' : ''}`}
            onClick={() => { setActiveTab('students'); setStudentSubTab('single'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <UserPlus size={18} />
            Register Student
          </button>
          <button 
            className={`nav-link ${activeTab === 'students' && studentSubTab === 'csv' ? 'active' : ''}`}
            onClick={() => { setActiveTab('students'); setStudentSubTab('csv'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <FileSpreadsheet size={18} />
            CSV Batch Import
          </button>
          <button 
            className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <User size={18} />
            My Profile
          </button>
        </div>
        <div style={{ marginTop: 'auto', padding: '16px 0' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            College Name:<br/>
            <strong style={{ color: 'var(--text-main)' }}>{user.college_name || "College"}</strong>
          </div>
          <button className="btn btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={logout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: '30px', marginBottom: '6px' }}>College Admin Console</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
              Monitor student submissions, audit compliance records, and manage account credits.
            </p>

            {/* Stats Cards */}
            {loadingStats ? (
              <div className="spinner"></div>
            ) : stats && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                  
                  {/* Credits Card */}
                  <div className="glass-card" style={{ borderLeft: stats.low_credit_alert ? '4px solid var(--danger)' : '4px solid var(--success)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Credits Remaining
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
                      {stats.credits_remaining} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ {stats.allocated_credits}</span>
                    </div>
                    {stats.low_credit_alert && (
                      <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={14} /> Low balance! Less than 20% remaining.
                      </div>
                    )}
                  </div>

                  {/* Monthly Submissions */}
                  <div className="glass-card">
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Submissions (This Month)
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
                      {stats.submissions_this_month}
                    </div>
                    <div style={{ color: 'var(--success)', fontSize: '12px', marginTop: '8px' }}>
                      Active compliance checks
                    </div>
                  </div>

                  {/* Registered Students */}
                  <div className="glass-card">
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Registered Students
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
                      {students.length}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>
                      Accounts using college credits
                    </div>
                  </div>
                </div>

                {/* Analytical Charts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                  
                  {/* Avg Similarity Score by Department */}
                  <div className="glass-card" style={{ minHeight: '350px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Average Similarity Score by Department</h3>
                    <div style={{ width: '100%', height: '260px' }}>
                      {stats.dept_stats.length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                          No data available
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.dept_stats}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="department" stroke="var(--text-muted)" />
                            <YAxis stroke="var(--text-muted)" unit="%" />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                            <Legend />
                            <Bar dataKey="avg_similarity" name="Avg Similarity %" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Submission Volumes */}
                  <div className="glass-card" style={{ minHeight: '350px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Monthly Submissions Volumes</h3>
                    <div style={{ width: '100%', height: '260px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.monthly_volume}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="month" stroke="var(--text-muted)" />
                          <YAxis stroke="var(--text-muted)" />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                          <Legend />
                          <Line type="monotone" dataKey="count" name="Submissions Count" stroke="var(--primary)" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SUBMISSIONS AUDIT LOG */}
        {activeTab === 'submissions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '26px' }}>Submissions Audit Log (NAAC Verification)</h2>
              <button className="btn btn-accent" style={{ color: 'var(--bg-primary)', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={triggerExport}>
                <Download size={16} /> Export CSV Report
              </button>
            </div>

            {/* Filter Form Panel */}
            <form onSubmit={handleFilterSubmit} className="glass-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Department</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. CS"
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Min Similarity (%)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="0"
                  value={filters.min_similarity}
                  onChange={(e) => setFilters({ ...filters, min_similarity: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Max Similarity (%)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="100"
                  value={filters.max_similarity}
                  onChange={(e) => setFilters({ ...filters, max_similarity: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Start Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">End Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: '1', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Filter size={16} /> Filter
                </button>
                <button type="button" className="btn btn-secondary" style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={handleFilterClear}>
                  <RotateCcw size={16} /> Clear
                </button>
              </div>
            </form>

            {/* Submissions List Grid */}
            {loadingSubmissions ? (
              <div className="spinner"></div>
            ) : submissions.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No student submissions found matching the selected filters.
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Student Account</th>
                      <th>Document Filename</th>
                      <th>Dept</th>
                      <th>Word Count</th>
                      <th>Date Submitted</th>
                      <th>Similarity Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s.id}>
                        <td>#{s.id}</td>
                        <td>
                          <strong>{s.user_details?.first_name} {s.user_details?.last_name}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.user_details?.email}</div>
                        </td>
                        <td>{s.document.split('/').pop()}</td>
                        <td><span style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '12px' }}>{s.department || 'N/A'}</span></td>
                        <td>{s.word_count}</td>
                        <td>{new Date(s.created_at).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 'bold', color: s.similarity_score !== null ? (s.similarity_score > 25 ? 'var(--danger)' : 'var(--success)') : 'inherit' }}>
                          {s.similarity_score !== null ? `${s.similarity_score}%` : 'In Queue'}
                        </td>
                        <td>
                          <span className={`badge badge-${s.status.toLowerCase().replace(' ', '-')}`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STUDENT ROSTER & REGISTRATION */}
        {activeTab === 'students' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '26px', marginBottom: '4px' }}>Student Management Roster</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                View enrolled student accounts, add single accounts, or batch import CSV files.
              </p>
            </div>

            {/* SUB-TAB 1: STUDENT DIRECTORY ROSTER */}
            {studentSubTab === 'roster' && (
              <div className="glass-card">
                <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Registered Students Directory</h3>
                {loadingStudents ? (
                  <div className="spinner"></div>
                ) : students.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No students registered under your college yet. Use the sub-tabs above to add students.
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Username</th>
                          <th>Email Address</th>
                          <th>Department</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id}>
                            <td>
                              <strong>{student.first_name} {student.last_name}</strong>
                            </td>
                            <td>
                              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>@{student.username}</span>
                            </td>
                            <td>{student.email}</td>
                            <td>
                              <span style={{ padding: '2px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                {student.department || 'General'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: ADD SINGLE STUDENT FORM */}
            {studentSubTab === 'single' && (
              <div className="glass-card">
                <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Register New Student</h3>
                <form onSubmit={handleSingleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Username</label>
                    <input 
                      type="text" 
                      placeholder="Username" 
                      className="form-control" 
                      required 
                      value={newStudent.username}
                      onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="student@college.edu" 
                      className="form-control" 
                      required
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Default Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      className="form-control" 
                      required
                      value={newStudent.password}
                      onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">First Name</label>
                      <input 
                        type="text" 
                        placeholder="First Name" 
                        className="form-control" 
                        value={newStudent.first_name}
                        onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Last Name</label>
                      <input 
                        type="text" 
                        placeholder="Last Name" 
                        className="form-control" 
                        value={newStudent.last_name}
                        onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <label className="form-label">Department</label>
                    <select 
                      className="form-control" 
                      value={newStudent.department || 'Computer Science'}
                      onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Electrical and Electronics">Electrical and Electronics</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setStudentSubTab('roster')}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={addingStudent}>
                      {addingStudent ? "Registering..." : "Register Student"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SUB-TAB 3: BULK CSV IMPORT FORM */}
            {studentSubTab === 'csv' && (
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>CSV Student Batch Import</h3>
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    style={{ fontSize: '13px' }}
                    onClick={() => {
                      const csvContent = "data:text/csv;charset=utf-8,username,email,first_name,last_name,department\njohn_doe,john@democollege.edu,John,Doe,Computer Science\njane_smith,jane@democollege.edu,Jane,Smith,Information technology";
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", "student_batch_import_template.csv");
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    }}
                  >
                    <Download size={15} /> Download Sample CSV Template
                  </button>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  <strong>Note:</strong> Upload a <code>.csv</code> file containing the required column headers: <code>username, email, first_name, last_name, department</code>
                </p>

                <form onSubmit={handleCsvUpload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div 
                    className="dropzone"
                    style={{ padding: '36px 20px', backgroundColor: csvFile ? '#f0f9ff' : '#ffffff', borderColor: csvFile ? 'var(--primary)' : 'var(--border-color)' }}
                    onClick={() => document.getElementById('csv-file-input').click()}
                  >
                    <input 
                      id="csv-file-input"
                      type="file" 
                      accept=".csv" 
                      style={{ display: 'none' }}
                      onChange={(e) => setCsvFile(e.target.files[0])}
                    />
                    <FileSpreadsheet size={36} color="var(--primary)" style={{ marginBottom: '10px' }} />
                    {csvFile ? (
                      <div>
                        <h4 style={{ color: 'var(--primary)', fontWeight: 'bold', marginBottom: '4px' }}>{csvFile.name}</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {(csvFile.size / 1024).toFixed(1)} KB • Click to replace file
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
                          Click or drag and drop your <code>.csv</code> file here
                        </h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          Supports UTF-8 formatted CSV spreadsheets up to 10MB
                        </p>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => { setStudentSubTab('roster'); setCsvFile(null); setCsvResult(null); }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }} disabled={uploadingCsv || !csvFile}>
                      {uploadingCsv ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                          Importing Students...
                        </div>
                      ) : (
                        "Start Batch Import"
                      )}
                    </button>
                  </div>
                </form>

                {/* Import Results Table */}
                {csvResult && (
                  <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 'bold', fontSize: '15px', marginBottom: '16px' }}>
                      <CheckCircle2 size={18} /> {csvResult.message}
                    </div>

                    {csvResult.created && csvResult.created.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '12px', color: 'var(--text-muted)' }}>
                          Generated Student Credentials ({csvResult.created.length})
                        </h4>
                        <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                          <table className="custom-table">
                            <thead>
                              <tr>
                                <th>Username</th>
                                <th>Generated Password</th>
                                <th>Department</th>
                              </tr>
                            </thead>
                            <tbody>
                              {csvResult.created.map((item, index) => (
                                <tr key={index}>
                                  <td><strong>{item.username}</strong></td>
                                  <td><code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: 'var(--primary)', fontWeight: 'bold' }}>{item.password}</code></td>
                                  <td>{item.department || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {csvResult.errors && csvResult.errors.length > 0 && (
                      <div style={{ marginTop: '16px', padding: '12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b', fontSize: '13px' }}>
                        <strong>Validation Alerts:</strong>
                        <ul style={{ marginTop: '6px', paddingLeft: '20px', marginBottom: 0 }}>
                          {csvResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <ProfilePage user={user} />
        )}

      </main>
    </div>
  );
}
