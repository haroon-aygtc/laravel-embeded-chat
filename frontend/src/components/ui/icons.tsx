import {
    LucideProps,
    User,
    Users,
    Settings,
    ChevronLeft,
    ChevronRight,
    Blocks,
    Box,
    BarChart,
    Bookmark,
    Check,
    ChevronDown,
    CreditCard,
    File,
    FileText,
    HelpCircle,
    Image,
    Laptop,
    LayoutDashboard,
    Loader2,
    Lock,
    Mail,
    Menu,
    MessageSquare,
    Moon,
    MoreVertical,
    Plus,
    Search,
    Star,
    Sun,
    Trash,
    UserPlus,
    X,
    AlertTriangle,
    Terminal,
    Zap,
    Sparkles,
    Bot,
    UserCog,
    Shield,
    FileCode,
    Database,
    Globe,
    PanelLeft,
    PanelRight
} from "lucide-react"

export const Icons = {
    user: User,
    users: Users,
    settings: Settings,
    chevronLeft: ChevronLeft,
    chevronRight: ChevronRight,
    blocks: Blocks,
    box: Box,
    barChart: BarChart,
    bookmark: Bookmark,
    check: Check,
    chevronDown: ChevronDown,
    creditCard: CreditCard,
    file: File,
    fileText: FileText,
    helpCircle: HelpCircle,
    image: Image,
    laptop: Laptop,
    layoutDashboard: LayoutDashboard,
    loader: Loader2,
    lock: Lock,
    mail: Mail,
    menu: Menu,
    messageSquare: MessageSquare,
    moon: Moon,
    moreVertical: MoreVertical,
    plus: Plus,
    search: Search,
    star: Star,
    sun: Sun,
    trash: Trash,
    userPlus: UserPlus,
    x: X,
    warning: AlertTriangle,
    terminal: Terminal,
    zap: Zap,
    sparkles: Sparkles,
    bot: Bot,
    userCog: UserCog,
    shield: Shield,
    fileCode: FileCode,
    database: Database,
    globe: Globe,
    panelLeft: PanelLeft,
    panelRight: PanelRight,
    spinner: ({ className, ...props }: LucideProps) => (
        <Loader2 className={`animate-spin ${className}`} {...props} />
    ),
    logo: ({ ...props }: LucideProps) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="24"
            height="24"
            {...props}
        >
            <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.2" />
            <path
                d="M12 6v12m-6-6h12"
                stroke="currentColor"
                strokeWidth="2"
            />
        </svg>
    ),
} 