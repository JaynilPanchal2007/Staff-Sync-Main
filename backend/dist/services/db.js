import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { AdminModel } from '../models/Admin.js';
import { OrganizationModel } from '../models/Organization.js';
import { StaffModel } from '../models/Staff.js';
import { AttendanceModel } from '../models/Attendance.js';
import { TimetableModel } from '../models/Timetable.js';
import { ShiftModel } from '../models/Shift.js';
import { GapModel } from '../models/Gap.js';
import { ProxyRequestModel } from '../models/ProxyRequest.js';
import { ExchangeRequestModel } from '../models/ExchangeRequest.js';
import { NotificationModel } from '../models/Notification.js';
import { AuditLogModel } from '../models/AuditLog.js';
import { SettingsModel } from '../models/Settings.js';
export class DatabaseService {
    isMongoConnected = false;
    mongoUri = null;
    // In-memory cache for ultra-fast sync lookups
    dbCache = {
        admin: {
            id: 'admin_darshan_patel',
            adminId: 'admin_darshan_patel',
            name: 'Dr. Darshan Patel',
            email: 'darshan.patel@staffsync.org',
            role: 'Administrator',
            organizationId: null,
            organizationType: null,
            createdAt: new Date().toISOString(),
        },
        admins: [],
        organizations: [],
        staff: [],
        attendance: [],
        timetable: [],
        shifts: [],
        gaps: [],
        proxyRequests: [],
        exchanges: [],
        notifications: [],
        auditLogs: [
            {
                id: 'log_init',
                logId: 'log_init',
                actor: 'System',
                action: 'INITIALIZE_SYSTEM',
                entity: 'Admin',
                entityId: 'admin_darshan_patel',
                timestamp: new Date().toISOString(),
                metadata: { note: 'StaffSync initialized with predefined Administrator Dr. Darshan Patel' },
            },
        ],
        settings: {
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
    };
    constructor() {
        this.initDefaultSeedData();
        this.initMongo();
    }
    initDefaultSeedData() {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const makeAvail = (days) => days.map((day) => ({ day, available: true }));
        const SCHOOL_ORG_ID = 'org_school_01';
        const COLLEGE_ORG_ID = 'org_college_01';
        const INDUSTRY_ORG_ID = 'org_industry_01';
        this.dbCache.organizations = [
            {
                id: SCHOOL_ORG_ID,
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
                id: COLLEGE_ORG_ID,
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
                id: INDUSTRY_ORG_ID,
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
        this.dbCache.staff = [
            // ── SCHOOL STAFF ──
            {
                id: 'staff_school_1',
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
                id: 'staff_school_2',
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
                id: 'staff_school_3',
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
                id: 'staff_school_4',
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
                id: 'staff_college_1',
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
                id: 'staff_college_2',
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
                id: 'staff_college_3',
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
                id: 'staff_college_4',
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
            // ── INDUSTRY WORKFORCE STAFF ──
            {
                id: 'staff_industry_1',
                staffId: 'staff_industry_1',
                organizationId: INDUSTRY_ORG_ID,
                name: 'Alex Rivera',
                employeeId: 'EMP-I101',
                email: 'alex.rivera@titanprecision.com',
                phone: '+91 98222 30001',
                department: 'Operations & Assembly',
                role: 'Senior Line Operator',
                subjects: ['CNC Milling', 'Assembly Line Operations', 'Pneumatics'],
                classes: ['Line A - Morning Shift', 'Line B'],
                skills: ['CNC Milling', 'Precision Machining', 'Pneumatics', 'Safety Inspection'],
                qualification: 'Diploma in Mechanical Engineering',
                experience: '7',
                workingDays: DAYS,
                availability: makeAvail(DAYS),
                maxWorkload: 40,
                maxWeeklyHours: 48,
                assignedLectures: 0,
                weeklyHours: 40,
                proxyCount: 2,
                status: 'active',
            },
            {
                id: 'staff_industry_2',
                staffId: 'staff_industry_2',
                organizationId: INDUSTRY_ORG_ID,
                name: 'Marcus Vance',
                employeeId: 'EMP-I102',
                email: 'marcus.vance@titanprecision.com',
                phone: '+91 98222 30002',
                department: 'Quality Control',
                role: 'QC Inspector',
                subjects: ['Quality Control', 'ISO Audit', 'Tolerance Testing'],
                classes: ['Quality Testing Lab'],
                skills: ['CNC Milling', 'Calipers', 'CMM Testing', 'ISO 9001 Auditing'],
                qualification: 'B.E. Manufacturing',
                experience: '5',
                workingDays: DAYS,
                availability: makeAvail(DAYS),
                maxWorkload: 40,
                maxWeeklyHours: 48,
                assignedLectures: 0,
                weeklyHours: 38,
                proxyCount: 1,
                status: 'active',
            },
            {
                id: 'staff_industry_3',
                staffId: 'staff_industry_3',
                organizationId: INDUSTRY_ORG_ID,
                name: 'Sarah Jenkins (Industrial)',
                employeeId: 'EMP-I103',
                email: 'sarah.industrial@titanprecision.com',
                phone: '+91 98222 30003',
                department: 'Maintenance & Automation',
                role: 'Automation Technician',
                subjects: ['PLC Programming', 'Robotic Arm Maintenance'],
                classes: ['Robotics Bay'],
                skills: ['PLC Programming', 'SCADA', 'Robotic Maintenance', 'Electrical Troubleshooting'],
                qualification: 'Diploma in Electrical & Automation',
                experience: '6',
                workingDays: DAYS,
                availability: makeAvail(DAYS),
                maxWorkload: 40,
                maxWeeklyHours: 48,
                assignedLectures: 0,
                weeklyHours: 40,
                proxyCount: 0,
                status: 'active',
            },
            {
                id: 'staff_industry_4',
                staffId: 'staff_industry_4',
                organizationId: INDUSTRY_ORG_ID,
                name: 'David Chen',
                employeeId: 'EMP-I104',
                email: 'david.chen@titanprecision.com',
                phone: '+91 98222 30004',
                department: 'Production Planning',
                role: 'Shift Supervisor',
                subjects: ['Lean Manufacturing', 'Six Sigma', 'Shift Management'],
                classes: ['Plant Floor 1'],
                skills: ['Shift Scheduling', 'Lean Manufacturing', 'Six Sigma Green Belt'],
                qualification: 'B.Tech Industrial Engineering',
                experience: '10',
                workingDays: DAYS,
                availability: makeAvail(DAYS),
                maxWorkload: 40,
                maxWeeklyHours: 48,
                assignedLectures: 0,
                weeklyHours: 42,
                proxyCount: 0,
                status: 'active',
            },
        ];
        this.dbCache.timetable = [
            // ── SCHOOL TIMETABLE ──
            {
                id: 'tt_sch_math_mon',
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
                id: 'tt_sch_phy_mon',
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
            // ── COLLEGE TIMETABLE ──
            {
                id: 'tt_col_ds_mon',
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
                id: 'tt_col_os_mon',
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
        ];
        this.dbCache.shifts = [
            {
                id: 'shift_ind_morning_1',
                shiftId: 'shift_ind_morning_1',
                organizationId: INDUSTRY_ORG_ID,
                employeeId: 'EMP-I101',
                employeeName: 'Alex Rivera',
                employeeCustomId: 'EMP-I101',
                date: todayStr,
                startTime: '06:00',
                endTime: '14:00',
                department: 'Operations & Assembly',
                role: 'Senior Line Operator',
                requiredSkills: ['CNC Milling', 'Pneumatics'],
                location: 'Assembly Line 1',
                status: 'scheduled',
            },
            {
                id: 'shift_ind_morning_2',
                shiftId: 'shift_ind_morning_2',
                organizationId: INDUSTRY_ORG_ID,
                employeeId: 'EMP-I102',
                employeeName: 'Marcus Vance',
                employeeCustomId: 'EMP-I102',
                date: todayStr,
                startTime: '06:00',
                endTime: '14:00',
                department: 'Quality Control',
                role: 'QC Inspector',
                requiredSkills: ['Tolerance Testing', 'ISO Audit'],
                location: 'QC Lab',
                status: 'completed',
            },
        ];
        this.dbCache.attendance = [
            {
                id: `att_sch_1_${todayStr}`,
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
                id: `att_col_1_${todayStr}`,
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
                id: `att_ind_1_${todayStr}`,
                attendanceId: `att_ind_1_${todayStr}`,
                organizationId: INDUSTRY_ORG_ID,
                staffId: 'staff_industry_1',
                employeeId: 'EMP-I101',
                staffName: 'Alex Rivera',
                date: todayStr,
                status: 'absent',
                remarks: 'Emergency leave on Morning Shift.',
            },
        ];
        this.dbCache.gaps = [
            {
                id: 'gap_school_math',
                gapId: 'gap_school_math',
                organizationId: SCHOOL_ORG_ID,
                date: todayStr,
                day: todayDayName,
                startTime: '08:30',
                endTime: '09:20',
                affectedType: 'lecture',
                targetItem: { subject: 'Mathematics', classGrade: 'Grade 10', section: 'A', room: 'Room 201' },
                absentStaffId: 'staff_school_1',
                absentStaffName: 'Mrs. Anjali Sharma',
                absentEmployeeId: 'TCH-101',
                subject: 'Mathematics',
                classGrade: 'Grade 10',
                section: 'A',
                room: 'Room 201',
                department: 'Mathematics',
                status: 'candidates_found',
                candidateCount: 1,
                recommendedCandidate: {
                    staffId: 'staff_school_2',
                    staffName: 'Mr. Rajesh Kumar',
                    employeeId: 'TCH-102',
                    role: 'Physics & Math Teacher',
                    department: 'Science',
                    matchScore: 92,
                    reasons: ['✓ Qualified Math teacher', '✓ Free slot'],
                },
            },
            {
                id: 'gap_college_ds',
                gapId: 'gap_college_ds',
                organizationId: COLLEGE_ORG_ID,
                date: todayStr,
                day: todayDayName,
                startTime: '09:00',
                endTime: '10:00',
                affectedType: 'lecture',
                targetItem: { subject: 'Data Structures', classGrade: 'Year 2', section: 'A', room: 'Lecture Hall A' },
                absentStaffId: 'staff_college_1',
                absentStaffName: 'Dr. Robert Vance',
                absentEmployeeId: 'FAC-C101',
                subject: 'Data Structures',
                classGrade: 'Year 2',
                section: 'A',
                room: 'Lecture Hall A',
                department: 'Computer Science',
                status: 'candidates_found',
                candidateCount: 1,
                recommendedCandidate: {
                    staffId: 'staff_college_2',
                    staffName: 'Prof. Sarah Jenkins',
                    employeeId: 'FAC-C102',
                    role: 'Associate Professor',
                    department: 'Computer Science',
                    matchScore: 95,
                    reasons: ['✓ CS Colleague', '✓ Free slot'],
                },
            },
            {
                id: 'gap_industry_shift',
                gapId: 'gap_industry_shift',
                organizationId: INDUSTRY_ORG_ID,
                date: todayStr,
                day: todayDayName,
                startTime: '06:00',
                endTime: '14:00',
                affectedType: 'shift',
                targetItem: { shiftId: 'shift_ind_morning_1', role: 'Senior Line Operator' },
                absentStaffId: 'staff_industry_1',
                absentStaffName: 'Alex Rivera',
                absentEmployeeId: 'EMP-I101',
                role: 'Senior Line Operator',
                department: 'Operations & Assembly',
                status: 'candidates_found',
                candidateCount: 1,
                recommendedCandidate: {
                    staffId: 'staff_industry_2',
                    staffName: 'Marcus Vance',
                    employeeId: 'EMP-I102',
                    role: 'QC Inspector',
                    department: 'Quality Control',
                    matchScore: 88,
                    reasons: ['✓ Skilled in CNC Milling', '✓ Present on Morning Shift'],
                },
            },
        ];
        this.dbCache.proxyRequests = [
            {
                id: 'req_school_proxy_1',
                proxyRequestId: 'req_school_proxy_1',
                organizationId: SCHOOL_ORG_ID,
                gapId: 'gap_school_math',
                fromStaffId: 'staff_school_1',
                fromStaffName: 'Mrs. Anjali Sharma',
                targetStaffId: 'staff_school_2',
                targetStaffName: 'Mr. Rajesh Kumar',
                targetEmployeeId: 'TCH-102',
                workDetails: { subject: 'Mathematics', classGrade: 'Grade 10', section: 'A', room: 'Room 201', date: todayStr },
                matchScore: 92,
                reasons: ['✓ Qualified Math teacher', '✓ Free slot'],
                status: 'pending',
            },
            {
                id: 'req_college_proxy_1',
                proxyRequestId: 'req_college_proxy_1',
                organizationId: COLLEGE_ORG_ID,
                gapId: 'gap_college_ds',
                fromStaffId: 'staff_college_1',
                fromStaffName: 'Dr. Robert Vance',
                targetStaffId: 'staff_college_2',
                targetStaffName: 'Prof. Sarah Jenkins',
                targetEmployeeId: 'FAC-C102',
                workDetails: { subject: 'Data Structures', classGrade: 'Year 2', section: 'A', room: 'Lecture Hall A', date: todayStr },
                matchScore: 95,
                reasons: ['✓ CS Colleague', '✓ Free slot'],
                status: 'pending',
            },
        ];
    }
    async initMongo() {
        const uri = process.env.MONGODB_URI;
        console.log(uri);
        if (uri && uri.trim().length > 0) {
            try {
                this.mongoUri = uri;
                await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
                console.log("Code runs here 1...");
                this.isMongoConnected = true;
                console.log("Code runs here 2...");
                console.log('[StaffSync Backend] Successfully connected to MongoDB Atlas / Local MongoDB instance.');
                await this.syncFromMongo();
            }
            catch (err) {
                console.warn('[StaffSync Backend] MongoDB connection attempted but failed. Using in-memory fallback engine:', err.message);
                this.isMongoConnected = false;
            }
        }
    }
    async syncFromMongo() {
        if (!this.isMongoConnected)
            return;
        try {
            // 1. Admin (all admins; primary = school/legacy admin for fallbacks)
            const adminDocs = await AdminModel.find();
            if (adminDocs.length === 0) {
                await AdminModel.create({
                    adminId: this.dbCache.admin.adminId || 'admin_darshan_patel',
                    name: this.dbCache.admin.name,
                    email: this.dbCache.admin.email,
                    role: this.dbCache.admin.role,
                    organizationId: this.dbCache.admin.organizationId,
                    organizationType: this.dbCache.admin.organizationType,
                    hashedPassword: this.dbCache.admin.hashedPassword,
                });
            }
            const allAdminDocs = await AdminModel.find();
            this.dbCache.admins = allAdminDocs.map((adm) => ({
                id: adm.adminId,
                adminId: adm.adminId,
                name: adm.name,
                email: adm.email,
                role: adm.role,
                organizationId: adm.organizationId,
                organizationType: adm.organizationType,
                hashedPassword: adm.hashedPassword,
                createdAt: adm.createdAt?.toISOString ? adm.createdAt.toISOString() : undefined,
            }));
            const primary = this.dbCache.admins.find((a) => a.organizationId === 'org_school_01') || this.dbCache.admins[0];
            this.dbCache.admin = primary || this.dbCache.admin;
            // 2. Organizations
            const orgDocs = await OrganizationModel.find();
            this.dbCache.organizations = orgDocs.map((o) => ({
                id: o.orgId,
                orgId: o.orgId,
                name: o.name,
                type: o.type,
                address: o.address,
                contactEmail: o.contactEmail,
                contactPhone: o.contactPhone,
                workingDays: o.workingDays,
                workingHours: o.workingHours,
                timezone: o.timezone,
                createdAt: o.createdAt.toISOString(),
            }));
            // 3. Staff
            const staffDocs = await StaffModel.find();
            this.dbCache.staff = staffDocs.map((s) => ({
                id: s.staffId,
                staffId: s.staffId,
                organizationId: s.organizationId,
                name: s.name,
                employeeId: s.employeeId,
                email: s.email,
                phone: s.phone,
                department: s.department,
                role: s.role,
                subjects: s.subjects,
                classes: s.classes,
                skills: s.skills,
                certifications: s.certifications,
                qualification: s.qualification,
                experience: s.experience,
                workingDays: s.workingDays,
                availability: s.availability,
                maxWorkload: s.maxWorkload,
                maxWeeklyHours: s.maxWeeklyHours,
                assignedLectures: s.assignedLectures,
                weeklyHours: s.weeklyHours,
                proxyCount: s.proxyCount,
                status: s.status,
                createdAt: s.createdAt.toISOString(),
            }));
            // 4. Attendance
            const attDocs = await AttendanceModel.find();
            this.dbCache.attendance = attDocs.map((a) => ({
                id: a.attendanceId,
                attendanceId: a.attendanceId,
                organizationId: a.organizationId,
                staffId: a.staffId,
                employeeId: a.employeeId,
                staffName: a.staffName,
                date: a.date,
                status: a.status,
                remarks: a.remarks,
                createdAt: a.createdAt.toISOString(),
            }));
            // 5. Timetable
            const ttDocs = await TimetableModel.find();
            this.dbCache.timetable = ttDocs.map((t) => ({
                id: t.timetableId,
                timetableId: t.timetableId,
                organizationId: t.organizationId,
                facultyId: t.facultyId,
                facultyName: t.facultyName,
                facultyEmployeeId: t.facultyEmployeeId,
                subject: t.subject,
                day: t.day,
                startTime: t.startTime,
                endTime: t.endTime,
                classGrade: t.classGrade,
                section: t.section,
                room: t.room,
                createdAt: t.createdAt.toISOString(),
            }));
            // 6. Shifts
            const shiftDocs = await ShiftModel.find();
            this.dbCache.shifts = shiftDocs.map((sh) => ({
                id: sh.shiftId,
                shiftId: sh.shiftId,
                organizationId: sh.organizationId,
                employeeId: sh.employeeId,
                employeeName: sh.employeeName,
                employeeCustomId: sh.employeeCustomId,
                date: sh.date,
                startTime: sh.startTime,
                endTime: sh.endTime,
                department: sh.department,
                role: sh.role,
                requiredSkills: sh.requiredSkills,
                location: sh.location,
                status: sh.status,
                createdAt: sh.createdAt.toISOString(),
            }));
            // 7. Gaps
            const gapDocs = await GapModel.find();
            this.dbCache.gaps = gapDocs.map((g) => ({
                id: g.gapId,
                gapId: g.gapId,
                organizationId: g.organizationId,
                date: g.date,
                day: g.day,
                startTime: g.startTime,
                endTime: g.endTime,
                affectedType: g.affectedType,
                targetItem: g.targetItem,
                absentStaffId: g.absentStaffId,
                absentStaffName: g.absentStaffName,
                absentEmployeeId: g.absentEmployeeId,
                subject: g.subject,
                classGrade: g.classGrade,
                section: g.section,
                room: g.room,
                role: g.role,
                department: g.department,
                requiredSkills: g.requiredSkills,
                requiredSkillsOrSubject: g.requiredSkillsOrSubject,
                status: g.status,
                candidateCount: g.candidateCount,
                recommendedCandidate: g.recommendedCandidate,
                assignedTargetStaffId: g.assignedTargetStaffId,
                assignedTargetStaffName: g.assignedTargetStaffName,
                proxyRequestId: g.proxyRequestId,
                resolvedByStaffId: g.resolvedByStaffId,
                resolvedByStaffName: g.resolvedByStaffName,
                resolvedAt: g.resolvedAt,
                createdAt: g.createdAt.toISOString(),
            }));
            // 8. ProxyRequests
            const prDocs = await ProxyRequestModel.find();
            this.dbCache.proxyRequests = prDocs.map((p) => ({
                id: p.proxyRequestId,
                proxyRequestId: p.proxyRequestId,
                organizationId: p.organizationId,
                gapId: p.gapId,
                fromStaffId: p.fromStaffId,
                fromStaffName: p.fromStaffName,
                targetStaffId: p.targetStaffId,
                targetStaffName: p.targetStaffName,
                targetEmployeeId: p.targetEmployeeId,
                workDetails: p.workDetails,
                matchScore: p.matchScore,
                reasons: p.reasons,
                status: p.status,
                respondedAt: p.respondedAt,
                createdAt: p.createdAt.toISOString(),
            }));
            // 9. Exchange requests
            const exchDocs = await ExchangeRequestModel.find();
            this.dbCache.exchanges = exchDocs.map((x) => ({
                id: x.exchangeId,
                exchangeId: x.exchangeId,
                organizationId: x.organizationId,
                sourceTimetableId: x.sourceTimetableId,
                sourceFacultyId: x.sourceFacultyId,
                sourceFacultyName: x.sourceFacultyName,
                targetTimetableId: x.targetTimetableId,
                targetFacultyId: x.targetFacultyId,
                targetFacultyName: x.targetFacultyName,
                day: x.day,
                startTime: x.startTime,
                endTime: x.endTime,
                subject: x.subject,
                note: x.note,
                status: x.status,
                respondedAt: x.respondedAt,
                createdAt: x.createdAt.toISOString(),
            }));
            // 10. Notifications
            const notifDocs = await NotificationModel.find();
            this.dbCache.notifications = notifDocs.map((n) => ({
                id: n.notificationId,
                notificationId: n.notificationId,
                organizationId: n.organizationId,
                targetStaffId: n.targetStaffId,
                type: n.type,
                title: n.title,
                message: n.message,
                read: n.read,
                metadata: n.metadata,
                createdAt: n.createdAt.toISOString(),
            }));
            // 10. AuditLogs
            const logDocs = await AuditLogModel.find();
            if (logDocs.length > 0) {
                this.dbCache.auditLogs = logDocs.map((l) => ({
                    id: l.logId,
                    logId: l.logId,
                    organizationId: l.organizationId,
                    actor: l.actor,
                    action: l.action,
                    entity: l.entity,
                    entityId: l.entityId,
                    timestamp: l.timestamp,
                    metadata: l.metadata,
                }));
            }
            // 11. Settings
            const setDoc = await SettingsModel.findOne();
            if (setDoc) {
                this.dbCache.settings = {
                    scoringWeights: setDoc.scoringWeights,
                    workingHours: setDoc.workingHours,
                    maxWeeklyHours: setDoc.maxWeeklyHours,
                    maxWorkloadLectures: setDoc.maxWorkloadLectures,
                };
            }
        }
        catch (err) {
            console.error('[StaffSync Backend] Error syncing from MongoDB:', err);
        }
    }
    async connectMongo(uri) {
        try {
            await mongoose.disconnect();
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
            this.isMongoConnected = true;
            this.mongoUri = uri;
            await this.syncFromMongo();
            return { success: true, message: 'Successfully connected to MongoDB!' };
        }
        catch (err) {
            this.isMongoConnected = false;
            return { success: false, message: err.message };
        }
    }
    getStatus() {
        return {
            isMongoConnected: this.isMongoConnected,
            mongoUri: this.mongoUri ? `${this.mongoUri.split('@')[0]}...` : null,
            mode: this.isMongoConnected ? 'mongodb' : 'persistent_local',
            collections: {
                staffCount: this.dbCache.staff.length,
                attendanceCount: this.dbCache.attendance.length,
                timetableCount: this.dbCache.timetable.length,
                shiftsCount: this.dbCache.shifts.length,
                gapsCount: this.dbCache.gaps.length,
                proxyRequestsCount: this.dbCache.proxyRequests.length,
                notificationsCount: this.dbCache.notifications.length,
            },
        };
    }
    // Admin access
    getAdmin() {
        return this.dbCache.admin;
    }
    getAdmins() {
        return this.dbCache.admins;
    }
    getAdminByOrg(orgId) {
        if (!orgId)
            return null;
        return (this.dbCache.admins.find((a) => a.organizationId === orgId || (a.organizationType === 'global' && a.id === 'admin_darshan_patel')) || null);
    }
    getAdminByEmail(email) {
        if (!email)
            return null;
        const clean = email.trim().toLowerCase();
        return this.dbCache.admins.find((a) => a.email?.trim().toLowerCase() === clean) || null;
    }
    updateAdmin(updates) {
        this.dbCache.admin = { ...this.dbCache.admin, ...updates };
        const idx = this.dbCache.admins.findIndex((a) => a.adminId === this.dbCache.admin.adminId);
        if (idx >= 0) {
            this.dbCache.admins[idx] = { ...this.dbCache.admins[idx], ...updates };
        }
        if (this.isMongoConnected) {
            AdminModel.findOneAndUpdate({ adminId: this.dbCache.admin.adminId || 'admin_darshan_patel' }, { ...updates }, { upsert: true }).catch(console.error);
        }
        return this.dbCache.admin;
    }
    addAdmin(adminData) {
        const existing = this.dbCache.admins.find((a) => a.adminId === adminData.adminId);
        if (existing) {
            return this.updateAdmin({ ...adminData, adminId: existing.adminId });
        }
        const fullAdmin = { ...adminData };
        this.dbCache.admins.push(fullAdmin);
        if (this.isMongoConnected) {
            AdminModel.updateOne({ adminId: fullAdmin.adminId }, { $set: fullAdmin }, { upsert: true }).catch(console.error);
        }
        return fullAdmin;
    }
    // Organizations
    getOrganizations() {
        return this.dbCache.organizations;
    }
    getOrganization(id) {
        return this.dbCache.organizations.find((o) => o.id === id || o.orgId === id) || null;
    }
    saveOrganization(org) {
        const existingIndex = this.dbCache.organizations.findIndex((o) => o.id === org.id || o.orgId === org.id);
        const orgId = org.id || org.orgId || `org_${Date.now()}`;
        const formatted = {
            ...org,
            id: orgId,
            orgId,
            createdAt: org.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        if (existingIndex >= 0) {
            this.dbCache.organizations[existingIndex] = formatted;
        }
        else {
            this.dbCache.organizations.push(formatted);
        }
        // Only auto-assign to admin if admin has no organization yet
        if (this.dbCache.admin && !this.dbCache.admin.organizationId) {
            this.dbCache.admin.organizationId = orgId;
            this.dbCache.admin.organizationType = org.type;
            this.updateAdmin({ organizationId: orgId, organizationType: org.type });
        }
        if (this.isMongoConnected) {
            OrganizationModel.findOneAndUpdate({ orgId }, formatted, { upsert: true }).catch(console.error);
        }
        return formatted;
    }
    // Staff
    getStaff(orgId) {
        if (!orgId)
            return this.dbCache.staff;
        return this.dbCache.staff.filter((s) => s.organizationId === orgId);
    }
    getStaffById(id) {
        if (!id)
            return null;
        const cleanId = id.trim().toLowerCase();
        return (this.dbCache.staff.find((s) => s.id?.toLowerCase() === cleanId ||
            s.staffId?.toLowerCase() === cleanId ||
            s.employeeId?.toLowerCase() === cleanId ||
            s.name?.toLowerCase() === cleanId) || null);
    }
    addStaff(staffMember) {
        const staffId = staffMember.id || staffMember.staffId || `staff_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const newStaff = {
            ...staffMember,
            id: staffId,
            staffId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            proxyCount: staffMember.proxyCount || 0,
            assignedLectures: staffMember.assignedLectures || 0,
            weeklyHours: staffMember.weeklyHours || 0,
        };
        this.dbCache.staff.push(newStaff);
        if (this.isMongoConnected) {
            StaffModel.create(newStaff).catch(console.error);
        }
        return newStaff;
    }
    updateStaff(id, updates) {
        const idx = this.dbCache.staff.findIndex((s) => s.id === id || s.staffId === id || s.employeeId === id);
        if (idx === -1)
            return null;
        this.dbCache.staff[idx] = { ...this.dbCache.staff[idx], ...updates, updatedAt: new Date().toISOString() };
        const targetStaff = this.dbCache.staff[idx];
        if (this.isMongoConnected) {
            StaffModel.findOneAndUpdate({ staffId: targetStaff.staffId }, updates).catch(console.error);
        }
        return targetStaff;
    }
    deleteStaff(id) {
        const idx = this.dbCache.staff.findIndex((s) => s.id === id || s.staffId === id || s.employeeId === id);
        if (idx === -1)
            return false;
        const targetStaff = this.dbCache.staff[idx];
        this.dbCache.staff.splice(idx, 1);
        if (this.isMongoConnected) {
            StaffModel.deleteOne({ staffId: targetStaff.staffId }).catch(console.error);
        }
        return true;
    }
    // Attendance
    getAttendance(orgId, date) {
        let list = this.dbCache.attendance;
        if (orgId)
            list = list.filter((a) => a.organizationId === orgId);
        if (date)
            list = list.filter((a) => a.date === date);
        return list;
    }
    setAttendance(record) {
        const idx = this.dbCache.attendance.findIndex((a) => a.staffId === record.staffId && a.date === record.date);
        const attendanceId = idx >= 0 ? this.dbCache.attendance[idx].id : `att_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const updated = {
            ...record,
            id: attendanceId,
            attendanceId,
            updatedAt: new Date().toISOString(),
        };
        if (idx >= 0) {
            this.dbCache.attendance[idx] = updated;
        }
        else {
            this.dbCache.attendance.push({
                ...updated,
                createdAt: new Date().toISOString(),
            });
        }
        if (this.isMongoConnected) {
            AttendanceModel.findOneAndUpdate({ attendanceId }, updated, { upsert: true }).catch(console.error);
        }
        return updated;
    }
    // Timetable
    getTimetable(orgId, facultyId) {
        let list = this.dbCache.timetable;
        if (orgId)
            list = list.filter((t) => t.organizationId === orgId);
        if (facultyId && facultyId !== 'all') {
            const cleanFid = facultyId.trim().toLowerCase();
            list = list.filter((t) => t.facultyId?.toLowerCase() === cleanFid ||
                t.facultyEmployeeId?.toLowerCase() === cleanFid ||
                t.facultyName?.toLowerCase() === cleanFid);
        }
        return list;
    }
    addTimetableEntry(entry) {
        const timetableId = entry.id || entry.timetableId || `tt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newEntry = {
            ...entry,
            id: timetableId,
            timetableId,
            createdAt: new Date().toISOString(),
        };
        this.dbCache.timetable.push(newEntry);
        if (this.isMongoConnected) {
            TimetableModel.create(newEntry).catch(console.error);
        }
        return newEntry;
    }
    updateTimetableEntry(id, updates) {
        const idx = this.dbCache.timetable.findIndex((t) => t.id === id || t.timetableId === id);
        if (idx === -1)
            return null;
        this.dbCache.timetable[idx] = { ...this.dbCache.timetable[idx], ...updates };
        if (this.isMongoConnected) {
            TimetableModel.findOneAndUpdate({ timetableId: id }, updates).catch(console.error);
        }
        return this.dbCache.timetable[idx];
    }
    deleteTimetableEntry(id) {
        const idx = this.dbCache.timetable.findIndex((t) => t.id === id || t.timetableId === id);
        if (idx === -1)
            return false;
        const target = this.dbCache.timetable[idx];
        this.dbCache.timetable.splice(idx, 1);
        if (this.isMongoConnected) {
            TimetableModel.deleteOne({ timetableId: target.timetableId }).catch(console.error);
        }
        return true;
    }
    getTimetableEntryById(id) {
        return this.dbCache.timetable.find((t) => t.id === id || t.timetableId === id) || null;
    }
    // Exchange requests
    getExchanges(orgId, facultyId, status) {
        let list = this.dbCache.exchanges;
        if (orgId)
            list = list.filter((x) => x.organizationId === orgId);
        if (facultyId) {
            list = list.filter((x) => x.sourceFacultyId === facultyId || x.targetFacultyId === facultyId);
        }
        if (status && status !== 'all')
            list = list.filter((x) => x.status === status);
        return list;
    }
    getExchangeById(id) {
        return this.dbCache.exchanges.find((x) => x.id === id || x.exchangeId === id) || null;
    }
    addExchangeRequest(data) {
        const exchangeId = data.id || data.exchangeId || `exch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newReq = {
            ...data,
            id: exchangeId,
            exchangeId,
            status: data.status || 'pending',
            createdAt: new Date().toISOString(),
        };
        this.dbCache.exchanges.push(newReq);
        if (this.isMongoConnected) {
            ExchangeRequestModel.create(newReq).catch(console.error);
        }
        return newReq;
    }
    updateExchangeRequest(id, updates) {
        const idx = this.dbCache.exchanges.findIndex((x) => x.id === id || x.exchangeId === id);
        if (idx === -1)
            return null;
        this.dbCache.exchanges[idx] = { ...this.dbCache.exchanges[idx], ...updates };
        if (this.isMongoConnected) {
            ExchangeRequestModel.findOneAndUpdate({ exchangeId: id }, updates).catch(console.error);
        }
        return this.dbCache.exchanges[idx];
    }
    // Shifts
    getShifts(orgId, employeeId, date) {
        let list = this.dbCache.shifts;
        if (orgId)
            list = list.filter((s) => s.organizationId === orgId);
        if (employeeId)
            list = list.filter((s) => s.employeeId === employeeId);
        if (date)
            list = list.filter((s) => s.date === date);
        return list;
    }
    addShift(shift) {
        const shiftId = shift.id || shift.shiftId || `shift_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newShift = {
            ...shift,
            id: shiftId,
            shiftId,
            createdAt: new Date().toISOString(),
        };
        this.dbCache.shifts.push(newShift);
        if (this.isMongoConnected) {
            ShiftModel.create(newShift).catch(console.error);
        }
        return newShift;
    }
    updateShift(id, updates) {
        const idx = this.dbCache.shifts.findIndex((s) => s.id === id || s.shiftId === id);
        if (idx === -1)
            return null;
        this.dbCache.shifts[idx] = { ...this.dbCache.shifts[idx], ...updates };
        if (this.isMongoConnected) {
            ShiftModel.findOneAndUpdate({ shiftId: id }, updates).catch(console.error);
        }
        return this.dbCache.shifts[idx];
    }
    deleteShift(id) {
        const idx = this.dbCache.shifts.findIndex((s) => s.id === id || s.shiftId === id);
        if (idx === -1)
            return false;
        const target = this.dbCache.shifts[idx];
        this.dbCache.shifts.splice(idx, 1);
        if (this.isMongoConnected) {
            ShiftModel.deleteOne({ shiftId: target.shiftId }).catch(console.error);
        }
        return true;
    }
    // Staffing Gaps
    getGaps(orgId, status) {
        let list = this.dbCache.gaps;
        if (orgId)
            list = list.filter((g) => g.organizationId === orgId);
        if (status)
            list = list.filter((g) => g.status === status);
        return list;
    }
    getGapById(id) {
        return this.dbCache.gaps.find((g) => g.id === id || g.gapId === id) || null;
    }
    addGap(gap) {
        const gapId = gap.id || gap.gapId || `gap_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newGap = {
            ...gap,
            id: gapId,
            gapId,
            status: gap.status || 'unresolved',
            createdAt: new Date().toISOString(),
        };
        this.dbCache.gaps.unshift(newGap);
        if (this.isMongoConnected) {
            GapModel.create(newGap).catch(console.error);
        }
        return newGap;
    }
    updateGap(id, updates) {
        const idx = this.dbCache.gaps.findIndex((g) => g.id === id || g.gapId === id);
        if (idx === -1)
            return null;
        this.dbCache.gaps[idx] = { ...this.dbCache.gaps[idx], ...updates, updatedAt: new Date().toISOString() };
        if (this.isMongoConnected) {
            GapModel.findOneAndUpdate({ gapId: id }, updates).catch(console.error);
        }
        return this.dbCache.gaps[idx];
    }
    // Proxy Requests
    getProxyRequests(orgId, staffId) {
        let list = this.dbCache.proxyRequests;
        if (orgId)
            list = list.filter((p) => p.organizationId === orgId);
        if (staffId) {
            list = list.filter((p) => p.targetStaffId === staffId || p.fromStaffId === staffId);
        }
        return list;
    }
    getProxyRequestById(id) {
        return this.dbCache.proxyRequests.find((p) => p.id === id || p.proxyRequestId === id) || null;
    }
    addProxyRequest(req) {
        const proxyRequestId = req.id || req.proxyRequestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newReq = {
            ...req,
            id: proxyRequestId,
            proxyRequestId,
            status: req.status || 'pending',
            createdAt: new Date().toISOString(),
        };
        this.dbCache.proxyRequests.unshift(newReq);
        if (this.isMongoConnected) {
            ProxyRequestModel.create(newReq).catch(console.error);
        }
        return newReq;
    }
    updateProxyRequest(id, updates) {
        const idx = this.dbCache.proxyRequests.findIndex((p) => p.id === id || p.proxyRequestId === id);
        if (idx === -1)
            return null;
        this.dbCache.proxyRequests[idx] = { ...this.dbCache.proxyRequests[idx], ...updates, updatedAt: new Date().toISOString() };
        if (this.isMongoConnected) {
            ProxyRequestModel.findOneAndUpdate({ proxyRequestId: id }, updates).catch(console.error);
        }
        return this.dbCache.proxyRequests[idx];
    }
    // Notifications
    getNotifications(orgId, staffId) {
        let list = this.dbCache.notifications;
        if (orgId)
            list = list.filter((n) => n.organizationId === orgId);
        if (staffId) {
            list = list.filter((n) => !n.targetStaffId || n.targetStaffId === staffId);
        }
        return list;
    }
    addNotification(notification) {
        const notificationId = notification.id || notification.notificationId || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newNotif = {
            ...notification,
            id: notificationId,
            notificationId,
            read: false,
            createdAt: new Date().toISOString(),
        };
        this.dbCache.notifications.unshift(newNotif);
        if (this.isMongoConnected) {
            NotificationModel.create(newNotif).catch(console.error);
        }
        return newNotif;
    }
    markNotificationRead(id) {
        const n = this.dbCache.notifications.find((item) => item.id === id || item.notificationId === id);
        if (n) {
            n.read = true;
            if (this.isMongoConnected) {
                NotificationModel.findOneAndUpdate({ notificationId: n.notificationId }, { read: true }).catch(console.error);
            }
        }
        return n;
    }
    markAllNotificationsRead(orgId, staffId) {
        this.dbCache.notifications.forEach((n) => {
            if ((!orgId || n.organizationId === orgId) && (!staffId || !n.targetStaffId || n.targetStaffId === staffId)) {
                n.read = true;
            }
        });
        if (this.isMongoConnected) {
            const query = {};
            if (orgId)
                query.organizationId = orgId;
            if (staffId)
                query.targetStaffId = staffId;
            NotificationModel.updateMany(query, { read: true }).catch(console.error);
        }
    }
    // Audit Logs
    getAuditLogs(orgId, limit = 100) {
        let list = this.dbCache.auditLogs;
        if (orgId)
            list = list.filter((l) => !l.organizationId || l.organizationId === orgId);
        return list.slice(-limit).reverse();
    }
    addAuditLog(log) {
        const logId = log.id || log.logId || `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newLog = {
            ...log,
            id: logId,
            logId,
            timestamp: new Date().toISOString(),
        };
        this.dbCache.auditLogs.push(newLog);
        if (this.isMongoConnected) {
            AuditLogModel.create(newLog).catch(console.error);
        }
        return newLog;
    }
    // Settings
    getSettings() {
        return this.dbCache.settings;
    }
    updateSettings(updates) {
        this.dbCache.settings = { ...this.dbCache.settings, ...updates };
        if (this.isMongoConnected) {
            SettingsModel.findOneAndUpdate({ organizationId: 'global' }, updates, { upsert: true }).catch(console.error);
        }
        return this.dbCache.settings;
    }
}
export const dbService = new DatabaseService();
