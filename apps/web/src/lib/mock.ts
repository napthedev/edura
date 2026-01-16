// Mock data for K-12 E-learning Platform

export const mockData = {
  // Site branding
  siteName: "Edura",
  tagline: "All in one management platform for private tutors",

  // Hero section
  hero: {
    title: "Transform Your Child's Learning Journey",
    subtitle:
      "Interactive courses, expert teachers, and personalized learning paths for K-12 students",
    ctaText: "Start Free Trial",
    stats: [
      { number: "50K+", label: "Students Learning" },
      { number: "200+", label: "Expert Teachers" },
      { number: "95%", label: "Parent Satisfaction" },
    ],
  },

  // Course categories
  courseCategories: [
    {
      id: 1,
      title: "Mathematics",
      description: "From basic arithmetic to advanced calculus",
      courses: 45,
      icon: "Calculator",
      color: "bg-primary/10 border-blue-200",
    },
    {
      id: 2,
      title: "Science",
      description: "Physics, Chemistry, Biology made fun",
      courses: 38,
      icon: "Microscope",
      color: "bg-green-50 border-green-200",
    },
    {
      id: 3,
      title: "English & Literature",
      description: "Reading, writing, and communication skills",
      courses: 32,
      icon: "BookOpen",
      color: "bg-purple-50 border-purple-200",
    },
    {
      id: 4,
      title: "Social Studies",
      description: "History, geography, and civic education",
      courses: 28,
      icon: "Globe",
      color: "bg-orange-50 border-orange-200",
    },
    {
      id: 5,
      title: "Arts & Music",
      description: "Creative expression and artistic skills",
      courses: 22,
      icon: "Palette",
      color: "bg-pink-50 border-pink-200",
    },
    {
      id: 6,
      title: "Computer Science",
      description: "Coding, digital literacy, and tech skills",
      courses: 25,
      icon: "Code",
      color: "bg-gray-50 border-gray-200",
    },
  ],

  // Featured courses
  featuredCourses: [
    {
      id: 1,
      title: "Algebra Fundamentals",
      instructor: "Ms. Sarah Johnson",
      grade: "Grades 7-9",
      duration: "8 weeks",
      students: 1250,
      rating: 4.9,
      price: "$49/month",
      thumbnail:
        "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400",
    },
    {
      id: 2,
      title: "Creative Writing Workshop",
      instructor: "Mr. David Chen",
      grade: "Grades 5-8",
      duration: "6 weeks",
      students: 890,
      rating: 4.8,
      price: "$39/month",
      thumbnail:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400",
    },
    {
      id: 3,
      title: "Introduction to Coding",
      instructor: "Ms. Emily Rodriguez",
      grade: "Grades 6-12",
      duration: "10 weeks",
      students: 2100,
      rating: 4.9,
      price: "$59/month",
      thumbnail:
        "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400",
    },
  ],

  // Student testimonials
  testimonials: [
    {
      id: 1,
      name: "Emma Thompson",
      grade: "Grade 8",
      text: "Edura made math so much easier to understand! The interactive lessons and games make learning fun.",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100",
    },
    {
      id: 2,
      name: "Michael Davis",
      grade: "Grade 10",
      text: "The coding course was amazing! I built my first website and now I want to become a programmer.",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    },
    {
      id: 3,
      name: "Sophia Wilson",
      grade: "Grade 6",
      text: "I love the science experiments we can do at home. It's like having a lab in my kitchen!",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
    },
  ],

  // Parent testimonials
  parentTestimonials: [
    {
      id: 1,
      name: "Jennifer Martinez",
      relation: "Parent of Alex (Grade 7)",
      text: "My son's grades improved dramatically after joining Edura. The personalized learning approach really works!",
      rating: 5,
    },
    {
      id: 2,
      name: "Robert Johnson",
      relation: "Parent of twins (Grade 5)",
      text: "Both my daughters are engaged and excited about learning. The platform is safe, educational, and fun.",
      rating: 5,
    },
  ],

  // Instructor profiles
  instructors: [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      subject: "Mathematics",
      experience: "15 years",
      education: "PhD in Mathematics Education",
      bio: "Passionate about making math accessible and enjoyable for all students.",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200",
      rating: 4.9,
      students: 2500,
    },
    {
      id: 2,
      name: "Mr. David Chen",
      subject: "English & Creative Writing",
      experience: "12 years",
      education: "MA in English Literature",
      bio: "Helping students find their voice through creative expression and writing.",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
      rating: 4.8,
      students: 1800,
    },
    {
      id: 3,
      name: "Ms. Emily Rodriguez",
      subject: "Computer Science",
      experience: "10 years",
      education: "MS in Computer Science",
      bio: "Introducing young minds to the exciting world of technology and coding.",
      avatar:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200",
      rating: 4.9,
      students: 3200,
    },
    {
      id: 4,
      name: "Dr. Michael Brown",
      subject: "Science",
      experience: "18 years",
      education: "PhD in Chemistry",
      bio: "Making science experiments safe, fun, and educational for curious minds.",
      avatar:
        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200",
      rating: 4.9,
      students: 2100,
    },
  ],

  // Pricing plans
  pricingPlans: [
    {
      id: 1,
      name: "Basic",
      price: "$19",
      period: "per month",
      description: "Perfect for getting started",
      features: [
        "Access to 5 courses per month",
        "Basic progress tracking",
        "Email support",
        "Mobile app access",
        "Parent dashboard",
      ],
      popular: false,
      ctaText: "Start Basic Plan",
    },
    {
      id: 2,
      name: "Standard",
      price: "$39",
      period: "per month",
      description: "Most popular choice for families",
      features: [
        "Unlimited course access",
        "Advanced progress analytics",
        "Priority support",
        "Offline course downloads",
        "Parent-teacher conferences",
        "Homework help sessions",
      ],
      popular: true,
      ctaText: "Choose Standard",
    },
    {
      id: 3,
      name: "Premium",
      price: "$69",
      period: "per month",
      description: "Complete learning solution",
      features: [
        "Everything in Standard",
        "1-on-1 tutoring sessions",
        "Personalized learning paths",
        "Advanced assessments",
        "College prep guidance",
        "24/7 support hotline",
      ],
      popular: false,
      ctaText: "Go Premium",
    },
  ],

  // FAQ data
  faqs: [
    {
      id: 1,
      question: "What age groups do you serve?",
      answer:
        "We provide courses for students from Kindergarten through 12th grade (ages 5-18).",
    },
    {
      id: 2,
      question: "Are the courses aligned with curriculum standards?",
      answer:
        "Yes, all our courses are aligned with Common Core standards and state curriculum requirements.",
    },
    {
      id: 3,
      question: "Can parents track their child's progress?",
      answer:
        "Absolutely! Our parent dashboard provides detailed progress reports, assignment completion rates, and performance analytics.",
    },
    {
      id: 4,
      question: "Do you offer live tutoring?",
      answer:
        "Yes, our Standard and Premium plans include access to live tutoring sessions with certified teachers.",
    },
    {
      id: 5,
      question: "Is there a free trial?",
      answer:
        "We offer a 7-day free trial with full access to our platform and courses.",
    },
  ],

  // Footer links
  footerLinks: {
    company: [
      { name: "About Us", href: "/about" },
      { name: "Our Mission", href: "/mission" },
      { name: "Careers", href: "/careers" },
      { name: "Press", href: "/press" },
    ],
    support: [
      { name: "Help Center", href: "/help" },
      { name: "Sign Up", href: "/signup" },
      { name: "Parent Resources", href: "/parents" },
      { name: "Technical Support", href: "/support" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "Safety Guidelines", href: "/safety" },
    ],
  },

  // Student analytics mock data for dashboard charts
  studentAnalytics: {
    // Grade trend over the past 6 months
    gradeHistory: [
      { month: "Aug 2025", avgScore: 72 },
      { month: "Sep 2025", avgScore: 75 },
      { month: "Oct 2025", avgScore: 78 },
      { month: "Nov 2025", avgScore: 82 },
      { month: "Dec 2025", avgScore: 79 },
      { month: "Jan 2026", avgScore: 85 },
    ],
    // Assignment completion by class
    assignmentsByClass: [
      { className: "Mathematics", completed: 12, pending: 2 },
      { className: "English", completed: 8, pending: 1 },
      { className: "Science", completed: 10, pending: 3 },
      { className: "History", completed: 6, pending: 0 },
    ],
    // Grade distribution (A/B/C/D/F ranges)
    gradeDistribution: [
      { grade: "A", range: "90-100", count: 8, color: "hsl(142, 76%, 36%)" },
      { grade: "B", range: "80-89", count: 12, color: "hsl(199, 89%, 48%)" },
      { grade: "C", range: "70-79", count: 6, color: "hsl(45, 93%, 47%)" },
      { grade: "D", range: "60-69", count: 3, color: "hsl(25, 95%, 53%)" },
      { grade: "F", range: "0-59", count: 1, color: "hsl(0, 84%, 60%)" },
    ],
    // Weekly study hours
    weeklyActivity: [
      { day: "Mon", hours: 2.5 },
      { day: "Tue", hours: 1.8 },
      { day: "Wed", hours: 3.2 },
      { day: "Thu", hours: 2.0 },
      { day: "Fri", hours: 1.5 },
      { day: "Sat", hours: 4.0 },
      { day: "Sun", hours: 2.8 },
    ],
  },
};
