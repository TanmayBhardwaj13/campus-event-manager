require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const StudentProfile = require('../src/models/StudentProfile');
const HostProfile = require('../src/models/HostProfile');
const Department = require('../src/models/Department');
const Club = require('../src/models/Club');
const Category = require('../src/models/Category');
const Event = require('../src/models/Event');
const Registration = require('../src/models/Registration');

const seed = async () => {
  try {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      StudentProfile.deleteMany({}),
      HostProfile.deleteMany({}),
      Department.deleteMany({}),
      Club.deleteMany({}),
      Category.deleteMany({}),
      Event.deleteMany({}),
      Registration.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // ========== DEPARTMENTS ==========
    const departments = await Department.insertMany([
      { name: 'Computer Science', code: 'CS', description: 'Department of Computer Science and Engineering' },
      { name: 'Information Technology', code: 'IT', description: 'Department of Information Technology' },
      { name: 'Mechanical Engineering', code: 'ME', description: 'Department of Mechanical Engineering' },
      { name: 'Electronics Engineering', code: 'EE', description: 'Department of Electronics and Communication' },
      { name: 'Civil Engineering', code: 'CE', description: 'Department of Civil Engineering' },
      { name: 'Management Studies', code: 'MBA', description: 'Department of Management Studies' },
    ]);
    console.log('✅ Departments created');

    // ========== CLUBS ==========
    const clubs = await Club.insertMany([
      { name: 'Coding Club', description: 'College coding and programming community', departmentId: departments[0]._id, approved: true },
      { name: 'Robotics Club', description: 'Building and programming robots', departmentId: departments[0]._id, approved: true },
      { name: 'Photography Club', description: 'Photography and visual arts', departmentId: null, approved: true },
      { name: 'Cultural Club', description: 'Cultural events and performing arts', departmentId: null, approved: true },
      { name: 'Entrepreneurship Club', description: 'Startup culture and business development', departmentId: departments[5]._id, approved: true },
      { name: 'Sports Club', description: 'College sports and athletics', departmentId: null, approved: true },
    ]);
    console.log('✅ Clubs created');

    // ========== CATEGORIES ==========
    const categories = await Category.insertMany([
      { name: 'Technical', slug: 'technical', color: '#6366f1', icon: 'cpu' },
      { name: 'Cultural', slug: 'cultural', color: '#ec4899', icon: 'music' },
      { name: 'Sports', slug: 'sports', color: '#10b981', icon: 'trophy' },
      { name: 'Workshop', slug: 'workshop', color: '#f59e0b', icon: 'tool' },
      { name: 'Seminar', slug: 'seminar', color: '#3b82f6', icon: 'mic' },
      { name: 'Hackathon', slug: 'hackathon', color: '#8b5cf6', icon: 'zap' },
      { name: 'Competition', slug: 'competition', color: '#ef4444', icon: 'award' },
      { name: 'Academic', slug: 'academic', color: '#14b8a6', icon: 'book-open' },
      { name: 'Club Activity', slug: 'club-activity', color: '#f97316', icon: 'users' },
      { name: 'Placement', slug: 'placement', color: '#84cc16', icon: 'briefcase' },
      { name: 'Entrepreneurship', slug: 'entrepreneurship', color: '#06b6d4', icon: 'lightbulb' },
      { name: 'Department Event', slug: 'department-event', color: '#a855f7', icon: 'building' },
    ]);
    console.log('✅ Categories created');

    // ========== ADMIN ==========
    const adminUser = new User({ name: 'College Admin', email: 'admin@college.edu', password: 'Admin@123', role: 'admin' });
    await adminUser.save();
    console.log('✅ Admin created: admin@college.edu / Admin@123');

    // ========== HOST USERS ==========
    const host1User = new User({ name: 'Prof. Arjun Kumar', email: 'arjun.kumar@college.edu', password: 'Host@123', role: 'host' });
    await host1User.save();
    await HostProfile.create({
      userId: host1User._id, hostType: 'faculty', departmentId: departments[0]._id,
      clubId: clubs[0]._id, designation: 'Faculty Advisor - Coding Club',
      description: 'Head of Computer Science department and advisor for Coding Club',
      verificationStatus: 'approved',
    });

    const host2User = new User({ name: 'Priya Sharma', email: 'priya.sharma@college.edu', password: 'Host@123', role: 'host' });
    await host2User.save();
    await HostProfile.create({
      userId: host2User._id, hostType: 'club', departmentId: null,
      clubId: clubs[3]._id, designation: 'President - Cultural Club',
      description: 'Organizing cultural events and college fests',
      verificationStatus: 'approved',
    });

    const host3User = new User({ name: 'Sports Committee', email: 'sports@college.edu', password: 'Host@123', role: 'host' });
    await host3User.save();
    await HostProfile.create({
      userId: host3User._id, hostType: 'committee', departmentId: null,
      clubId: clubs[5]._id, designation: 'Sports Committee Head',
      description: 'Managing all sports events on campus',
      verificationStatus: 'approved',
    });
    console.log('✅ Hosts created (all approved)');

    // ========== STUDENT USERS ==========
    const studentData = [
      { name: 'Rahul Verma', email: 'rahul.verma@student.college.edu', studentId: 'CS2021001', dept: 0, course: 'B.Tech CSE', year: 3 },
      { name: 'Sneha Patel', email: 'sneha.patel@student.college.edu', studentId: 'IT2022002', dept: 1, course: 'B.Tech IT', year: 2 },
      { name: 'Ankit Singh', email: 'ankit.singh@student.college.edu', studentId: 'ME2021003', dept: 2, course: 'B.Tech ME', year: 3 },
      { name: 'Divya Nair', email: 'divya.nair@student.college.edu', studentId: 'EE2023004', dept: 3, course: 'B.Tech EE', year: 1 },
      { name: 'Rohan Mehta', email: 'rohan.mehta@student.college.edu', studentId: 'CS2020005', dept: 0, course: 'B.Tech CSE', year: 4 },
    ];

    const students = [];
    for (const sd of studentData) {
      const u = new User({ name: sd.name, email: sd.email, password: 'Student@123', role: 'student' });
      await u.save();
      await StudentProfile.create({
        userId: u._id, studentId: sd.studentId, departmentId: departments[sd.dept]._id,
        course: sd.course, year: sd.year, phone: '98' + Math.floor(10000000 + Math.random() * 90000000)
      });
      students.push(u);
    }
    console.log('✅ Students created (password: Student@123)');

    // ========== EVENTS ==========
    const now = new Date();
    const future = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const past = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const events = await Event.insertMany([
      {
        title: 'Annual College Hackathon 2024',
        description: 'A 24-hour hackathon where teams compete to build innovative solutions. Open to all students. Prizes worth ₹50,000 to be won.',
        categoryId: categories[5]._id, departmentId: departments[0]._id, clubId: clubs[0]._id,
        hostId: host1User._id, building: 'Tech Block', block: 'A', room: 'Innovation Lab',
        venueDetails: 'Tech Block A - Innovation Lab',
        date: future(15), startTime: '09:00', endTime: '09:00',
        registrationDeadline: future(10), maxParticipants: 100,
        eligibility: 'All students', rules: 'Teams of 2-4 members.',
        approvalStatus: 'published', eventStatus: 'upcoming', currentRegistrations: 72,
      },
      {
        title: 'Inter-Department Coding Contest',
        description: 'Test your programming skills against the best coders from all departments.',
        categoryId: categories[0]._id, departmentId: departments[0]._id, clubId: clubs[0]._id,
        hostId: host1User._id, building: 'Computer Lab', block: 'B', room: 'Lab 201',
        venueDetails: 'Computer Lab B-201',
        date: future(7), startTime: '10:00', endTime: '13:00',
        registrationDeadline: future(5), maxParticipants: 60,
        eligibility: 'All CS/IT students', rules: 'Individual participation only.',
        approvalStatus: 'published', eventStatus: 'upcoming', currentRegistrations: 45,
      },
      {
        title: 'College Cultural Night 2024',
        description: 'The biggest cultural event of the year! Featuring dance, singing, drama, and much more.',
        categoryId: categories[1]._id, clubId: clubs[3]._id,
        hostId: host2User._id, building: 'Main Auditorium', block: '', room: 'Auditorium',
        venueDetails: 'Main Auditorium - Front Stage',
        date: future(20), startTime: '18:00', endTime: '22:00',
        registrationDeadline: future(18), maxParticipants: 500,
        eligibility: 'All students', rules: 'Respect all performers.',
        approvalStatus: 'published', eventStatus: 'upcoming', currentRegistrations: 320,
      },
      {
        title: 'Photography Competition: Campus Life',
        description: 'Capture the essence of campus life through your lens. Cash prizes for top 3 winners.',
        categoryId: categories[6]._id, clubId: clubs[2]._id,
        hostId: host2User._id, building: 'Admin Block', block: 'C', room: 'Seminar Hall 1',
        venueDetails: 'Admin Block C - Seminar Hall 1',
        date: future(12), startTime: '11:00', endTime: '16:00',
        registrationDeadline: future(8), maxParticipants: 80,
        eligibility: 'All students with camera/phone',
        approvalStatus: 'published', eventStatus: 'upcoming', currentRegistrations: 38,
      },
      {
        title: 'Basketball Championship',
        description: 'Annual inter-department basketball tournament. 5-on-5 format. Knockout rounds followed by finals.',
        categoryId: categories[2]._id, clubId: clubs[5]._id,
        hostId: host3User._id, building: 'Sports Complex', block: '', room: 'Basketball Court',
        venueDetails: 'Main Basketball Court - Sports Complex',
        date: future(25), startTime: '08:00', endTime: '18:00',
        registrationDeadline: future(15), maxParticipants: 120,
        eligibility: 'All male students', rules: 'NCAA rules apply.',
        approvalStatus: 'published', eventStatus: 'upcoming', currentRegistrations: 78,
      },
      {
        title: 'Python Workshop: From Zero to Hero',
        description: 'A comprehensive hands-on workshop on Python programming. Certificate of participation for all attendees.',
        categoryId: categories[3]._id, departmentId: departments[0]._id, clubId: clubs[0]._id,
        hostId: host1User._id, building: 'Tech Block', block: 'B', room: 'Computer Lab 3',
        venueDetails: 'Tech Block B - Computer Lab 3',
        date: future(5), startTime: '09:30', endTime: '16:30',
        registrationDeadline: future(3), maxParticipants: 40,
        eligibility: 'First and second year students',
        approvalStatus: 'published', eventStatus: 'upcoming', currentRegistrations: 35,
      },
      {
        title: 'Entrepreneurship Seminar: Start, Scale, Succeed',
        description: 'Learn from successful alumni entrepreneurs. Panel discussion with Q&A session.',
        categoryId: categories[4]._id, departmentId: departments[5]._id, clubId: clubs[4]._id,
        hostId: host2User._id, building: 'Management Block', block: 'D', room: 'Conference Hall',
        venueDetails: 'Management Block D - Conference Hall',
        date: future(30), startTime: '10:00', endTime: '13:00',
        registrationDeadline: future(25), maxParticipants: 150,
        eligibility: 'All students',
        approvalStatus: 'published', eventStatus: 'upcoming', currentRegistrations: 95,
      },
      {
        title: 'Robotics Workshop: Build Your First Robot',
        description: 'Hands-on workshop where you will build a line-following robot from scratch.',
        categoryId: categories[3]._id, departmentId: departments[3]._id, clubId: clubs[1]._id,
        hostId: host1User._id, building: 'Electronics Lab', block: 'E', room: 'Robotics Lab',
        venueDetails: 'Electronics Block E - Robotics Lab',
        date: past(5), startTime: '09:00', endTime: '17:00',
        registrationDeadline: past(8), maxParticipants: 30,
        eligibility: 'ECE and EE students',
        approvalStatus: 'published', eventStatus: 'completed', currentRegistrations: 28,
      },
      {
        title: 'College Debate Competition',
        description: 'Annual parliamentary debate competition. Cash prizes for winners.',
        categoryId: categories[6]._id,
        hostId: host2User._id, building: 'Main Block', block: 'A', room: 'Auditorium Hall',
        venueDetails: 'Main Block A - Auditorium',
        date: past(2), startTime: '13:00', endTime: '18:00',
        registrationDeadline: past(5), maxParticipants: 50,
        eligibility: 'All students',
        approvalStatus: 'published', eventStatus: 'completed', currentRegistrations: 42,
      },
      {
        title: 'Tech Quiz 2024: Battle of Brains',
        description: 'General knowledge and technology quiz. Teams of 3 members. Multiple rounds.',
        categoryId: categories[6]._id, departmentId: departments[0]._id, clubId: clubs[0]._id,
        hostId: host1User._id, building: 'Seminar Hall', block: 'C', room: 'Hall 2',
        venueDetails: 'Seminar Hall C-2',
        date: future(9), startTime: '14:00', endTime: '17:00',
        registrationDeadline: future(6), maxParticipants: 90,
        eligibility: 'All students (teams of 3)',
        approvalStatus: 'published', eventStatus: 'upcoming', currentRegistrations: 54,
      },
    ]);
    console.log('✅ Events created (10 events)');

    // ========== REGISTRATIONS ==========
    const regData = [
      { studentIdx: 0, eventIdx: 0, attendanceStatus: 'not-marked' },
      { studentIdx: 0, eventIdx: 1, attendanceStatus: 'not-marked' },
      { studentIdx: 0, eventIdx: 5, attendanceStatus: 'not-marked' },
      { studentIdx: 1, eventIdx: 0, attendanceStatus: 'not-marked' },
      { studentIdx: 1, eventIdx: 2, attendanceStatus: 'not-marked' },
      { studentIdx: 2, eventIdx: 4, attendanceStatus: 'not-marked' },
      { studentIdx: 2, eventIdx: 6, attendanceStatus: 'not-marked' },
      { studentIdx: 3, eventIdx: 3, attendanceStatus: 'not-marked' },
      { studentIdx: 4, eventIdx: 7, attendanceStatus: 'present', status: 'registered' },
      { studentIdx: 4, eventIdx: 8, attendanceStatus: 'present', status: 'registered' },
      { studentIdx: 0, eventIdx: 7, attendanceStatus: 'present', status: 'registered' },
      { studentIdx: 1, eventIdx: 8, attendanceStatus: 'absent', status: 'registered' },
    ];

    await Registration.insertMany(regData.map(r => ({
      studentId: students[r.studentIdx]._id,
      eventId: events[r.eventIdx]._id,
      status: r.status || 'registered',
      attendanceStatus: r.attendanceStatus || 'not-marked',
      registeredAt: new Date(),
    })));
    console.log('✅ Registrations created');

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('  Admin:   admin@college.edu / Admin@123');
    console.log('  Host 1:  arjun.kumar@college.edu / Host@123');
    console.log('  Host 2:  priya.sharma@college.edu / Host@123');
    console.log('  Host 3:  sports@college.edu / Host@123');
    console.log('  Student: rahul.verma@student.college.edu / Student@123');
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

// Connect then seed
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    seed();
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
