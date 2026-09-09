/**
 * StaffSync - Comprehensive 3-Sector Database Seeder
 * Populates MongoDB Atlas & persistent local storage with 3 completely isolated organizations:
 * 1. School Organization (Greenwood International School)
 * 2. College Organization (Apex Institute of Technology)
 * 3. Industrial Enterprise (Titan Precision Manufacturing)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
// Import Mongoose Models
import { AdminModel } from '../models/Admin.js';
import { OrganizationModel } from '../models/Organization.js';
import { StaffModel } from '../models/Staff.js';
import { AttendanceModel } from '../models/Attendance.js';
import { TimetableModel } from '../models/Timetable.js';
import { ShiftModel } from '../models/Shift.js';
import { GapModel } from '../models/Gap.js';
import { ProxyRequestModel } from '../models/ProxyRequest.js';
import { NotificationModel } from '../models/Notification.js';
import { AuditLogModel } from '../models/AuditLog.js';
import { SettingsModel } from '../models/Settings.js';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/staffsync';
export async function seedDatabase() {
    console.log('\n🌱 [StaffSync Seeder] Starting complete database reset & multi-sector seed...');
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const makeAvail = (days) => days.map((day) => ({ day, available: true }));
    // Organization Identifiers
    const SCHOOL_ORG_ID = 'org_school_01';
    const COLLEGE_ORG_ID = 'org_college_01';
    const INDUSTRY_ORG_ID = 'org_industry_01';
    // 1. Organizations
    const organizations = [
        {
            orgId: SCHOOL_ORG_ID,
            name: 'Greenwood International School',
            type: 'school',
            address: '742 Evergreen Terrace, Educational Zone, City',
            contactEmail: 'admin@greenwoodschool.edu',
            contactPhone: '+91 98765 43210',
            workingDays: DAYS,
            workingHours: { start: '08:00', end: '15:30' },
            timezone: 'UTC+05:30',
        },
        {
            orgId: COLLEGE_ORG_ID,
            name: 'Apex Institute of Engineering & Technology',
            type: 'college',
            address: 'Sector 25, Knowledge Park, University Campus',
            contactEmail: 'contact@apexinstitute.edu',
            contactPhone: '+91 98765 88990',
            workingDays: DAYS,
            workingHours: { start: '09:00', end: '17:00' },
            timezone: 'UTC+05:30',
        },
        {
            orgId: INDUSTRY_ORG_ID,
            name: 'Titan Precision Manufacturing Enterprise',
            type: 'industry',
            address: 'Industrial Plot 45, GIDC Industrial Estate',
            contactEmail: 'hr@titanprecision.com',
            contactPhone: '+91 98765 77110',
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            workingHours: { start: '06:00', end: '22:00' },
            timezone: 'UTC+05:30',
        },
    ];
    // 2. Staff Members
    const staffMembers = [
        // ── SCHOOL STAFF ──
        {
            staffId: 'staff_school_1',
            organizationId: SCHOOL_ORG_ID,
            name: 'Mrs. Anjali Sharma',
            employeeId: 'TCH-101',
            email: 'anjali.sharma@greenwoodschool.edu',
            phone: '+91 98000 10001',
            department: 'Mathematics',
            role: 'Senior Math Teacher',
            subjects: ['Mathematics', 'Algebra', 'Geometry'],
            classes: ['Grade 9 Sec A', 'Grade 10 Sec B'],
            skills: ['Classroom Management', 'Algebraic Logic', 'Student Mentoring'],
            qualification: 'M.Sc Mathematics, B.Ed',
            experience: '8',
            workingDays: DAYS,
            availability: makeAvail(DAYS),
            maxWorkload: 25,
            maxWeeklyHours: 35,
            assignedLectures: 18,
            weeklyHours: 25,
            proxyCount: 1,
            status: 'active',
        },
        {
            staffId: 'staff_school_2',
            organizationId: SCHOOL_ORG_ID,
            name: 'Mr. Rajesh Kumar',
            employeeId: 'TCH-102',
            email: 'rajesh.kumar@greenwoodschool.edu',
            phone: '+91 98000 10002',
            department: 'Science',
            role: 'Physics & Math Teacher',
            subjects: ['Physics', 'Mathematics', 'General Science'],
            classes: ['Grade 10 Sec A', 'Grade 11 Sec B'],
            skills: ['Physics Labs', 'Calculus', 'Interactive Teaching'],
            qualification: 'M.Sc Physics',
            experience: '6',
            workingDays: DAYS,
            availability: makeAvail(DAYS),
            maxWorkload: 25,
            maxWeeklyHours: 35,
            assignedLectures: 15,
            weeklyHours: 22,
            proxyCount: 2,
            status: 'active',
        },
        {
            staffId: 'staff_school_3',
            organizationId: SCHOOL_ORG_ID,
            name: 'Ms. Sunita Rao',
            employeeId: 'TCH-103',
            email: 'sunita.rao@greenwoodschool.edu',
            phone: '+91 98000 10003',
            department: 'English',
            role: 'English Literature Teacher',
            subjects: ['English Literature', 'Grammar', 'Creative Writing'],
            classes: ['Grade 9 Sec B', 'Grade 12 Sec A'],
            skills: ['Communication', 'Public Speaking', 'Essay Grading'],
            qualification: 'M.A. English, B.Ed',
            experience: '5',
            workingDays: DAYS,
            availability: makeAvail(DAYS),
            maxWorkload: 25,
            maxWeeklyHours: 35,
            assignedLectures: 16,
            weeklyHours: 24,
            proxyCount: 0,
            status: 'active',
        },
        {
            staffId: 'staff_school_4',
            organizationId: SCHOOL_ORG_ID,
            name: 'Mr. Vikram Malhotra',
            employeeId: 'TCH-104',
            email: 'vikram.malhotra@greenwoodschool.edu',
            phone: '+91 98000 10004',
            department: 'Social Studies',
            role: 'History & Civics Teacher',
            subjects: ['History', 'Civics', 'Geography'],
            classes: ['Grade 8 Sec A', 'Grade 10 Sec A'],
            skills: ['Map Work', 'Historical Analysis', 'Debate Coaching'],
            qualification: 'M.A. History',
            experience: '10',
            workingDays: DAYS,
            availability: makeAvail(DAYS),
            maxWorkload: 25,
            maxWeeklyHours: 35,
            assignedLectures: 14,
            weeklyHours: 21,
            proxyCount: 0,
            status: 'active',
        },
        // ── COLLEGE STAFF ──
        {
            staffId: 'staff_college_1',
            organizationId: COLLEGE_ORG_ID,
            name: 'Dr. Robert Vance',
            employeeId: 'FAC-C101',
            email: 'robert.vance@apexinstitute.edu',
            phone: '+91 98111 20001',
            department: 'Computer Science',
            role: 'Senior Professor & Head',
            subjects: ['Data Structures', 'Algorithms', 'Advanced Algorithms'],
            classes: ['Year 2 Sec A', 'Year 3 Sec A'],
            skills: ['C++', 'Python', 'Algorithm Design', 'Competitive Programming'],
            qualification: 'Ph.D in Computer Science (IIT Bombay)',
            experience: '12',
            workingDays: DAYS,
            availability: makeAvail(DAYS),
            maxWorkload: 20,
            maxWeeklyHours: 35,
            assignedLectures: 14,
            weeklyHours: 24,
            proxyCount: 1,
            status: 'active',
        },
        {
            staffId: 'staff_college_2',
            organizationId: COLLEGE_ORG_ID,
            name: 'Prof. Sarah Jenkins',
            employeeId: 'FAC-C102',
            email: 'sarah.jenkins@apexinstitute.edu',
            phone: '+91 98111 20002',
            department: 'Computer Science',
            role: 'Associate Professor',
            subjects: ['Operating Systems', 'DBMS', 'System Design'],
            classes: ['Year 2 Sec A', 'Year 4 Sec B'],
            skills: ['Linux', 'SQL', 'OS Architecture', 'Database Optimization'],
            qualification: 'M.Tech in Software Engineering',
            experience: '8',
            workingDays: DAYS,
            availability: makeAvail(DAYS),
            maxWorkload: 20,
            maxWeeklyHours: 35,
            assignedLectures: 12,
            weeklyHours: 20,
            proxyCount: 2,
            status: 'active',
        },
        {
            staffId: 'staff_college_3',
            organizationId: COLLEGE_ORG_ID,
            name: 'Dr. Michael Chang',
            employeeId: 'FAC-C103',
            email: 'michael.chang@apexinstitute.edu',
            phone: '+91 98111 20003',
            department: 'Information Technology',
            role: 'Assistant Professor',
            subjects: ['Computer Networks', 'Cloud Computing', 'Network Security'],
            classes: ['Year 3 Sec B', 'Year 4 Sec A'],
            skills: ['Networking', 'AWS', 'Cybersecurity', 'Wireshark'],
            qualification: 'Ph.D in Information Security',
            experience: '5',
            workingDays: DAYS,
            availability: makeAvail(DAYS),
            maxWorkload: 22,
            maxWeeklyHours: 38,
            assignedLectures: 15,
            weeklyHours: 25,
            proxyCount: 0,
            status: 'active',
        },
        {
            staffId: 'staff_college_4',
            organizationId: COLLEGE_ORG_ID,
            name: 'Prof. Elena Alvarez',
            employeeId: 'FAC-C104',
            email: 'elena.alvarez@apexinstitute.edu',
            phone: '+91 98111 20004',
            department: 'Mathematics',
            role: 'Associate Professor',
            subjects: ['Discrete Mathematics', 'Linear Algebra', 'Probability'],
            classes: ['Year 1 Sec A', 'Year 2 Sec B'],
            skills: ['Applied Mathematics', 'Calculus', 'MATLAB'],
            qualification: 'Ph.D in Mathematics',
            experience: '9',
            workingDays: DAYS,
            availability: makeAvail(DAYS),
            maxWorkload: 22,
            maxWeeklyHours: 38,
            assignedLectures: 10,
            weeklyHours: 18,
            proxyCount: 0,
            status: 'active',
        },
    ];
    // 3. Timetable Entries (School & College)
    const timetableEntries = [
        // ── SCHOOL TIMETABLE ──
        {
            timetableId: 'tt_sch_math_mon',
            organizationId: SCHOOL_ORG_ID,
            facultyId: 'staff_school_1',
            facultyName: 'Mrs. Anjali Sharma',
            facultyEmployeeId: 'TCH-101',
            subject: 'Mathematics',
            day: 'Monday',
            startTime: '08:30',
            endTime: '09:20',
            classGrade: 'Grade 10',
            section: 'A',
            room: 'Room 201',
        },
        {
            timetableId: 'tt_sch_phy_mon',
            organizationId: SCHOOL_ORG_ID,
            facultyId: 'staff_school_2',
            facultyName: 'Mr. Rajesh Kumar',
            facultyEmployeeId: 'TCH-102',
            subject: 'Physics',
            day: 'Monday',
            startTime: '09:20',
            endTime: '10:10',
            classGrade: 'Grade 10',
            section: 'A',
            room: 'Science Lab 1',
        },
        {
            timetableId: 'tt_sch_eng_tue',
            organizationId: SCHOOL_ORG_ID,
            facultyId: 'staff_school_3',
            facultyName: 'Ms. Sunita Rao',
            facultyEmployeeId: 'TCH-103',
            subject: 'English Literature',
            day: 'Tuesday',
            startTime: '10:30',
            endTime: '11:20',
            classGrade: 'Grade 9',
            section: 'B',
            room: 'Room 104',
        },
        {
            timetableId: 'tt_sch_chem_wed',
            organizationId: SCHOOL_ORG_ID,
            facultyId: 'staff_school_4',
            facultyName: 'Mr. Vikram Malhotra',
            facultyEmployeeId: 'TCH-104',
            subject: 'Chemistry',
            day: 'Wednesday',
            startTime: '08:30',
            endTime: '09:20',
            classGrade: 'Grade 10',
            section: 'A',
            room: 'Science Lab 2',
        },
        {
            timetableId: 'tt_sch_math_wed',
            organizationId: SCHOOL_ORG_ID,
            facultyId: 'staff_school_1',
            facultyName: 'Mrs. Anjali Sharma',
            facultyEmployeeId: 'TCH-101',
            subject: 'Mathematics',
            day: 'Wednesday',
            startTime: '09:20',
            endTime: '10:10',
            classGrade: 'Grade 10',
            section: 'A',
            room: 'Room 201',
        },
        {
            timetableId: 'tt_sch_his_thu',
            organizationId: SCHOOL_ORG_ID,
            facultyId: 'staff_school_2',
            facultyName: 'Mr. Rajesh Kumar',
            facultyEmployeeId: 'TCH-102',
            subject: 'History & Civics',
            day: 'Thursday',
            startTime: '10:30',
            endTime: '11:20',
            classGrade: 'Grade 9',
            section: 'A',
            room: 'Room 102',
        },
        // ── COLLEGE TIMETABLE ──
        {
            timetableId: 'tt_col_ds_mon',
            organizationId: COLLEGE_ORG_ID,
            facultyId: 'staff_college_1',
            facultyName: 'Dr. Robert Vance',
            facultyEmployeeId: 'FAC-C101',
            subject: 'Data Structures',
            day: 'Monday',
            startTime: '09:00',
            endTime: '10:00',
            classGrade: 'Year 2',
            section: 'A',
            room: 'Lecture Hall A',
        },
        {
            timetableId: 'tt_col_os_mon',
            organizationId: COLLEGE_ORG_ID,
            facultyId: 'staff_college_2',
            facultyName: 'Prof. Sarah Jenkins',
            facultyEmployeeId: 'FAC-C102',
            subject: 'Operating Systems',
            day: 'Monday',
            startTime: '10:15',
            endTime: '11:15',
            classGrade: 'Year 2',
            section: 'A',
            room: 'CS Lab 2',
        },
        {
            timetableId: 'tt_col_cn_tue',
            organizationId: COLLEGE_ORG_ID,
            facultyId: 'staff_college_3',
            facultyName: 'Dr. Michael Chang',
            facultyEmployeeId: 'FAC-C103',
            subject: 'Computer Networks',
            day: 'Tuesday',
            startTime: '11:30',
            endTime: '12:30',
            classGrade: 'Year 3',
            section: 'B',
            room: 'Room 304',
        },
        {
            timetableId: 'tt_col_la_wed',
            organizationId: COLLEGE_ORG_ID,
            facultyId: 'staff_college_4',
            facultyName: 'Prof. Elena Alvarez',
            facultyEmployeeId: 'FAC-C104',
            subject: 'Linear Algebra',
            day: 'Wednesday',
            startTime: '09:00',
            endTime: '10:00',
            classGrade: 'Year 2',
            section: 'A',
            room: 'Lecture Hall B',
        },
        {
            timetableId: 'tt_col_cd_wed',
            organizationId: COLLEGE_ORG_ID,
            facultyId: 'staff_college_1',
            facultyName: 'Dr. Robert Vance',
            facultyEmployeeId: 'FAC-C101',
            subject: 'Compiler Design',
            day: 'Wednesday',
            startTime: '13:00',
            endTime: '14:00',
            classGrade: 'Year 4',
            section: 'A',
            room: 'Room 105',
        },
        {
            timetableId: 'tt_col_ai_thu',
            organizationId: COLLEGE_ORG_ID,
            facultyId: 'staff_college_3',
            facultyName: 'Dr. Michael Chang',
            facultyEmployeeId: 'FAC-C103',
            subject: 'Artificial Intelligence',
            day: 'Thursday',
            startTime: '10:00',
            endTime: '11:00',
            classGrade: 'Year 3',
            section: 'A',
            room: 'Computer Lab 1',
        },
    ];
    // 4. Shift Entries (Industrial Organization)
    const shiftEntries = [];
    // 5. Attendance Records
    const attendanceRecords = [
        // School Attendance
        {
            attendanceId: `att_sch_1_${todayStr}`,
            organizationId: SCHOOL_ORG_ID,
            staffId: 'staff_school_1',
            employeeId: 'TCH-101',
            staffName: 'Mrs. Anjali Sharma',
            date: todayStr,
            status: 'absent',
            remarks: 'Sick leave requested.',
        },
        {
            attendanceId: `att_sch_2_${todayStr}`,
            organizationId: SCHOOL_ORG_ID,
            staffId: 'staff_school_2',
            employeeId: 'TCH-102',
            staffName: 'Mr. Rajesh Kumar',
            date: todayStr,
            status: 'present',
            remarks: 'On time.',
        },
        // College Attendance
        {
            attendanceId: `att_col_1_${todayStr}`,
            organizationId: COLLEGE_ORG_ID,
            staffId: 'staff_college_1',
            employeeId: 'FAC-C101',
            staffName: 'Dr. Robert Vance',
            date: todayStr,
            status: 'absent',
            remarks: 'Medical leave.',
        },
        {
            attendanceId: `att_col_2_${todayStr}`,
            organizationId: COLLEGE_ORG_ID,
            staffId: 'staff_college_2',
            employeeId: 'FAC-C102',
            staffName: 'Prof. Sarah Jenkins',
            date: todayStr,
            status: 'present',
            remarks: 'Punctual.',
        },
    ];
    // 6. Staffing Gaps
    const gaps = [
        // School Gap
        {
            gapId: 'gap_school_math',
            organizationId: SCHOOL_ORG_ID,
            date: todayStr,
            day: todayDayName,
            startTime: '08:30',
            endTime: '09:20',
            affectedType: 'lecture',
            targetItem: {
                timetableId: 'tt_sch_math_mon',
                subject: 'Mathematics',
                classGrade: 'Grade 10',
                section: 'A',
                room: 'Room 201',
            },
            absentStaffId: 'staff_school_1',
            absentStaffName: 'Mrs. Anjali Sharma',
            absentEmployeeId: 'TCH-101',
            subject: 'Mathematics',
            classGrade: 'Grade 10',
            section: 'A',
            room: 'Room 201',
            department: 'Mathematics',
            requiredSkillsOrSubject: 'Mathematics, Physics',
            status: 'candidates_found',
            candidateCount: 1,
            recommendedCandidate: {
                staffId: 'staff_school_2',
                staffName: 'Mr. Rajesh Kumar',
                employeeId: 'TCH-102',
                role: 'Physics & Math Teacher',
                department: 'Science',
                matchScore: 92,
                reasons: ['✓ Qualified Math & Physics teacher', '✓ Free at 08:30–09:20 slot'],
            },
        },
        // College Gap
        {
            gapId: 'gap_college_ds',
            organizationId: COLLEGE_ORG_ID,
            date: todayStr,
            day: todayDayName,
            startTime: '09:00',
            endTime: '10:00',
            affectedType: 'lecture',
            targetItem: {
                timetableId: 'tt_col_ds_mon',
                subject: 'Data Structures',
                classGrade: 'Year 2',
                section: 'A',
                room: 'Lecture Hall A',
            },
            absentStaffId: 'staff_college_1',
            absentStaffName: 'Dr. Robert Vance',
            absentEmployeeId: 'FAC-C101',
            subject: 'Data Structures',
            classGrade: 'Year 2',
            section: 'A',
            room: 'Lecture Hall A',
            department: 'Computer Science',
            requiredSkillsOrSubject: 'Data Structures, C++',
            status: 'candidates_found',
            candidateCount: 1,
            recommendedCandidate: {
                staffId: 'staff_college_2',
                staffName: 'Prof. Sarah Jenkins',
                employeeId: 'FAC-C102',
                role: 'Associate Professor',
                department: 'Computer Science',
                matchScore: 95,
                reasons: ['✓ CS Department Colleague', '✓ Expert in Data Structures & Systems'],
            },
        },
    ];
    // 7. Proxy Requests
    const proxyRequests = [
        {
            proxyRequestId: 'req_school_proxy_1',
            organizationId: SCHOOL_ORG_ID,
            gapId: 'gap_school_math',
            fromStaffId: 'staff_school_1',
            fromStaffName: 'Mrs. Anjali Sharma',
            targetStaffId: 'staff_school_2',
            targetStaffName: 'Mr. Rajesh Kumar',
            targetEmployeeId: 'TCH-102',
            workDetails: {
                affectedType: 'lecture',
                subject: 'Mathematics',
                classGrade: 'Grade 10',
                section: 'A',
                room: 'Room 201',
                date: todayStr,
                day: todayDayName,
                startTime: '08:30',
                endTime: '09:20',
            },
            matchScore: 92,
            reasons: ['✓ Qualified Math & Physics teacher', '✓ Free slot'],
            status: 'pending',
        },
        {
            proxyRequestId: 'req_college_proxy_1',
            organizationId: COLLEGE_ORG_ID,
            gapId: 'gap_college_ds',
            fromStaffId: 'staff_college_1',
            fromStaffName: 'Dr. Robert Vance',
            targetStaffId: 'staff_college_2',
            targetStaffName: 'Prof. Sarah Jenkins',
            targetEmployeeId: 'FAC-C102',
            workDetails: {
                affectedType: 'lecture',
                subject: 'Data Structures',
                classGrade: 'Year 2',
                section: 'A',
                room: 'Lecture Hall A',
                date: todayStr,
                day: todayDayName,
                startTime: '09:00',
                endTime: '10:00',
            },
            matchScore: 95,
            reasons: ['✓ CS Colleague', '✓ Free slot'],
            status: 'pending',
        },
    ];
    // 8. Notifications
    const notifications = [
        {
            notificationId: `notif_sch_proxy_1_${todayStr}`,
            organizationId: SCHOOL_ORG_ID,
            targetStaffId: 'staff_school_2',
            type: 'proxy_request',
            title: 'Cover Grade 10 Mathematics?',
            message: 'Mrs. Anjali Sharma is absent. Please review the proxy request for Mathematics (08:30–09:20, Room 201).',
            read: false,
            metadata: { gapId: 'gap_school_math', proxyRequestId: 'req_school_proxy_1' },
        },
        {
            notificationId: `notif_col_proxy_1_${todayStr}`,
            organizationId: COLLEGE_ORG_ID,
            targetStaffId: 'staff_college_2',
            type: 'proxy_request',
            title: 'Cover Data Structures?',
            message: 'Dr. Robert Vance is absent. You are recommended for Data Structures (09:00–10:00, Lecture Hall A).',
            read: false,
            metadata: { gapId: 'gap_college_ds', proxyRequestId: 'req_college_proxy_1' },
        },
    ];
    // ── MONGODB SEEDING PROCESS ──
    if (mongoose.connection.readyState === 1) {
        console.log('🧹 Purging all existing collections in MongoDB Atlas...');
        await AdminModel.deleteMany({});
        await OrganizationModel.deleteMany({});
        await StaffModel.deleteMany({});
        await AttendanceModel.deleteMany({});
        await TimetableModel.deleteMany({});
        await ShiftModel.deleteMany({});
        await GapModel.deleteMany({});
        await ProxyRequestModel.deleteMany({});
        await NotificationModel.deleteMany({});
        await AuditLogModel.deleteMany({});
        await SettingsModel.deleteMany({});
        console.log('✨ Writing 3 distinct Organizations to MongoDB...');
        const defaultAdminPassword = await bcrypt.hash('admin123', 10);
        await AdminModel.insertMany([
            {
                adminId: 'admin_darshan_patel',
                name: 'Dr. Darshan Patel',
                email: 'darshan.patel@staffsync.org',
                role: 'Administrator',
                organizationId: 'org_school_01',
                organizationType: 'school',
                hashedPassword: defaultAdminPassword,
            },
            {
                adminId: 'admin_apex_college',
                name: 'Prof. V. K. Sharma',
                email: 'contact@apexinstitute.edu',
                role: 'Dean / College Admin',
                organizationId: 'org_college_01',
                organizationType: 'college',
                hashedPassword: defaultAdminPassword,
            },
            {
                adminId: 'admin_titan_industry',
                name: 'Rajesh Mehta',
                email: 'hr@titanprecision.com',
                role: 'Plant HR Manager',
                organizationId: 'org_industry_01',
                organizationType: 'industry',
                hashedPassword: defaultAdminPassword,
            },
        ]);
        await SettingsModel.insertMany([
            {
                organizationId: 'global',
                scoringWeights: {
                    compatibility: 30,
                    availability: 20,
                    conflict: 15,
                    workload: 15,
                    fairness: 10,
                    experience: 10,
                },
                workingHours: { start: '08:00', end: '17:00' },
                maxWeeklyHours: 40,
                maxWorkloadLectures: 24,
            },
        ]);
        await OrganizationModel.insertMany(organizations);
        await StaffModel.insertMany(staffMembers);
        await TimetableModel.insertMany(timetableEntries);
        await ShiftModel.insertMany(shiftEntries);
        await AttendanceModel.insertMany(attendanceRecords);
        await GapModel.insertMany(gaps);
        await ProxyRequestModel.insertMany(proxyRequests);
        await NotificationModel.insertMany(notifications);
        console.log('✅ MongoDB database seeding completed successfully!');
    }
    return {
        organizations,
        staffMembers,
        timetableEntries,
        shiftEntries,
        attendanceRecords,
        gaps,
        proxyRequests,
        notifications,
    };
}
async function runStandaloneSeed() {
    try {
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        await seedDatabase();
    }
    catch (err) {
        console.log('Note: Running in standalone or persistent fallback mode:', err.message);
    }
    finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        process.exit(0);
    }
}
if (import.meta.url === `file://${process.argv[1]}`) {
    runStandaloneSeed();
}
