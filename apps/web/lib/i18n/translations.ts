export type Language = 'en' | 'pcm';

export const languageLabels: Record<Language, string> = {
  en: 'English',
  pcm: 'Pidgin',
};

export type TranslationKey =
  | 'nav.dashboard'
  | 'nav.discover'
  | 'nav.search_placeholder'
  | 'sidebar.dashboard'
  | 'sidebar.discover'
  | 'sidebar.saved'
  | 'sidebar.applications'
  | 'sidebar.my_lease'
  | 'sidebar.payments'
  | 'sidebar.flex_financing'
  | 'sidebar.my_home'
  | 'sidebar.maintenance'
  | 'sidebar.messages'
  | 'sidebar.automations'
  | 'sidebar.documents'
  | 'sidebar.legal_resources'
  | 'sidebar.roommates'
  | 'sidebar.trust_score'
  | 'sidebar.credit_report'
  | 'sidebar.notifications'
  | 'sidebar.calendar'
  | 'sidebar.settings'
  | 'sidebar.help'
  | 'sidebar.properties'
  | 'sidebar.listings'
  | 'sidebar.offers'
  | 'sidebar.reviews'
  | 'sidebar.trust_profile'
  | 'sidebar.verifications'
  | 'sidebar.verification'
  | 'sidebar.billing'
  | 'sidebar.home_management'
  | 'sidebar.realtor_access'
  | 'sidebar.transactions'
  | 'sidebar.units'
  | 'sidebar.tenants'
  | 'sidebar.leases'
  | 'sidebar.deposits'
  | 'sidebar.vendors'
  | 'sidebar.financials'
  | 'sidebar.owner_statements'
  | 'sidebar.arrears'
  | 'sidebar.legal_cases'
  | 'sidebar.managed'
  | 'sidebar.activity'
  | 'sidebar.queries'
  | 'sidebar.approvals'
  | 'sidebar.notices'
  | 'sidebar.landlord_leads'
  | 'sidebar.microsite'
  | 'sidebar.referrals'
  | 'sidebar.sale_listings'
  | 'sidebar.buyer_leads'
  | 'sidebar.investment_analytics'
  | 'sidebar.users'
  | 'sidebar.disputes'
  | 'sidebar.fraud_risk'
  | 'sidebar.escrow_oversight'
  | 'sidebar.audit_logs'
  | 'sidebar.reports'
  | 'sidebar.access_roles'
  | 'sidebar.clients'
  | 'sidebar.leads'
  | 'sidebar.viewings'
  | 'sidebar.commissions'
  | 'sidebar.tasks'
  | 'sidebar.inspections'
  | 'sidebar.sync_center'
  | 'sidebar.saved_properties'
  | 'sidebar.viewing_requests'
  | 'sidebar.land_marketplace'
  | 'sidebar.land_purchases'
  | 'sidebar.shortlets'
  | 'sidebar.shortlet_bookings'
  | 'dashboard.greeting_morning'
  | 'dashboard.greeting_afternoon'
  | 'dashboard.greeting_evening'
  | 'dashboard.subtitle'
  | 'dashboard.find_property'
  | 'dashboard.stats.saved_properties'
  | 'dashboard.stats.saved_properties_subtitle'
  | 'dashboard.stats.active_applications'
  | 'dashboard.stats.active_applications_subtitle'
  | 'dashboard.stats.unread_messages'
  | 'dashboard.stats.unread_messages_subtitle'
  | 'dashboard.stats.viewings_scheduled'
  | 'dashboard.stats.viewings_scheduled_subtitle'
  | 'dashboard.stats.current_lease'
  | 'dashboard.stats.current_lease_subtitle'
  | 'dashboard.stats.total_rent_paid'
  | 'dashboard.stats.total_rent_paid_subtitle'
  | 'dashboard.applications.title'
  | 'dashboard.applications.subtitle'
  | 'dashboard.applications.view_all'
  | 'dashboard.trust_score.title'
  | 'dashboard.trust_score.subtitle'
  | 'dashboard.trust_score.improve_button'
  | 'language.switch_language';

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.discover': 'Discover',
    'nav.search_placeholder': 'Search for properties, locations...',
    'sidebar.dashboard': 'Dashboard',
    'sidebar.discover': 'Discover',
    'sidebar.saved': 'Saved',
    'sidebar.applications': 'Applications',
    'sidebar.my_lease': 'My lease',
    'sidebar.payments': 'Payments',
    'sidebar.flex_financing': 'Flex financing',
    'sidebar.my_home': 'My home',
    'sidebar.maintenance': 'Maintenance',
    'sidebar.messages': 'Messages',
    'sidebar.automations': 'Automations',
    'sidebar.documents': 'Documents',
    'sidebar.legal_resources': 'Legal resources',
    'sidebar.roommates': 'Roommates',
    'sidebar.trust_score': 'Trust score',
    'sidebar.credit_report': 'Credit report',
    'sidebar.notifications': 'Notifications',
    'sidebar.calendar': 'Calendar',
    'sidebar.settings': 'Settings',
    'sidebar.help': 'Help',
    'sidebar.properties': 'Properties',
    'sidebar.listings': 'Listings',
    'sidebar.offers': 'Offers',
    'sidebar.reviews': 'Reviews',
    'sidebar.trust_profile': 'Trust profile',
    'sidebar.verifications': 'Verifications',
    'sidebar.verification': 'Verification',
    'sidebar.billing': 'Billing',
    'sidebar.home_management': 'Home Management',
    'sidebar.realtor_access': 'Realtor access',
    'sidebar.transactions': 'Transactions',
    'sidebar.units': 'Units',
    'sidebar.tenants': 'Tenants',
    'sidebar.leases': 'Leases',
    'sidebar.deposits': 'Deposits',
    'sidebar.vendors': 'Vendors',
    'sidebar.financials': 'Financials',
    'sidebar.owner_statements': 'Owner statements',
    'sidebar.arrears': 'Arrears',
    'sidebar.legal_cases': 'Legal cases',
    'sidebar.managed': 'Sureground Managed',
    'sidebar.activity': 'Activity log',
    'sidebar.queries': 'Ask your manager',
    'sidebar.approvals': 'Approvals',
    'sidebar.notices': 'Notices',
    'sidebar.landlord_leads': 'Leads',
    'sidebar.microsite': 'Microsite',
    'sidebar.referrals': 'Refer & Earn',
    'sidebar.sale_listings': 'Sale listings',
    'sidebar.buyer_leads': 'Buyer leads',
    'sidebar.investment_analytics': 'Investment analytics',
    'sidebar.users': 'Users',
    'sidebar.disputes': 'Disputes',
    'sidebar.fraud_risk': 'Fraud & Risk',
    'sidebar.escrow_oversight': 'Escrow oversight',
    'sidebar.audit_logs': 'Audit logs',
    'sidebar.reports': 'Reports',
    'sidebar.access_roles': 'Access & Roles',
    'sidebar.clients': 'Clients',
    'sidebar.leads': 'Leads',
    'sidebar.viewings': 'Viewings',
    'sidebar.commissions': 'Commissions',
    'sidebar.tasks': 'Tasks',
    'sidebar.inspections': 'Inspections',
    'sidebar.sync_center': 'Sync centre',
    'sidebar.saved_properties': 'Saved properties',
    'sidebar.viewing_requests': 'Viewing requests',
    'sidebar.land_marketplace': 'Land marketplace',
    'sidebar.land_purchases': 'My land',
    'sidebar.shortlets': 'Shortlets',
    'sidebar.shortlet_bookings': 'My bookings',
    'dashboard.greeting_morning': 'Good morning',
    'dashboard.greeting_afternoon': 'Good afternoon',
    'dashboard.greeting_evening': 'Good evening',
    'dashboard.subtitle': "Here's what's happening with your rentals today.",
    'dashboard.find_property': 'Find property',
    'dashboard.stats.saved_properties': 'Saved properties',
    'dashboard.stats.saved_properties_subtitle': 'In your shortlist',
    'dashboard.stats.active_applications': 'Active applications',
    'dashboard.stats.active_applications_subtitle': 'In your pipeline',
    'dashboard.stats.unread_messages': 'Unread messages',
    'dashboard.stats.unread_messages_subtitle': 'Across conversations',
    'dashboard.stats.viewings_scheduled': 'Viewings scheduled',
    'dashboard.stats.viewings_scheduled_subtitle': 'This week',
    'dashboard.stats.current_lease': 'Current lease',
    'dashboard.stats.current_lease_subtitle': 'Active lease',
    'dashboard.stats.total_rent_paid': 'Total rent paid',
    'dashboard.stats.total_rent_paid_subtitle': 'Lifetime',
    'dashboard.applications.title': 'My applications',
    'dashboard.applications.subtitle': 'Track your rental applications',
    'dashboard.applications.view_all': 'View all',
    'dashboard.trust_score.title': 'Your trust score',
    'dashboard.trust_score.subtitle': 'Build trust to unlock more features',
    'dashboard.trust_score.improve_button': 'Improve your trust score',
    'language.switch_language': 'Switch language',
  },
  pcm: {
    'nav.dashboard': 'Dashboard',
    'nav.discover': 'Find house',
    'nav.search_placeholder': 'Find house, area, wey you want...',
    'sidebar.dashboard': 'Dashboard',
    'sidebar.discover': 'Find house',
    'sidebar.saved': 'Wey I Save',
    'sidebar.applications': 'Application dem',
    'sidebar.my_lease': 'My agreement',
    'sidebar.payments': 'Payment dem',
    'sidebar.flex_financing': 'Flex loan',
    'sidebar.my_home': 'My house',
    'sidebar.maintenance': 'Repair matter',
    'sidebar.messages': 'Message dem',
    'sidebar.automations': 'Auto message',
    'sidebar.documents': 'Paper dem',
    'sidebar.legal_resources': 'Law matter',
    'sidebar.roommates': 'House people',
    'sidebar.trust_score': 'Trust score',
    'sidebar.credit_report': 'Credit report',
    'sidebar.notifications': 'Notification dem',
    'sidebar.calendar': 'Calendar',
    'sidebar.settings': 'Settings',
    'sidebar.help': 'Help',
    'sidebar.properties': 'Property dem',
    'sidebar.listings': 'Listing dem',
    'sidebar.offers': 'Offer dem',
    'sidebar.reviews': 'Review dem',
    'sidebar.trust_profile': 'Trust profile',
    'sidebar.verifications': 'Verification dem',
    'sidebar.verification': 'Verification',
    'sidebar.billing': 'Billing',
    'sidebar.home_management': 'House management',
    'sidebar.realtor_access': 'Realtor access',
    'sidebar.transactions': 'Transaction dem',
    'sidebar.units': 'Unit dem',
    'sidebar.tenants': 'Tenant dem',
    'sidebar.leases': 'Agreement dem',
    'sidebar.deposits': 'Deposit dem',
    'sidebar.vendors': 'Vendor dem',
    'sidebar.financials': 'Money matter',
    'sidebar.owner_statements': 'Owner statement dem',
    'sidebar.arrears': 'Rent wey dem owe',
    'sidebar.legal_cases': 'Court matter dem',
    'sidebar.managed': 'Make Sureground manage am',
    'sidebar.activity': 'Wetin don happen',
    'sidebar.queries': 'Ask your manager',
    'sidebar.approvals': 'Approval dem',
    'sidebar.notices': 'Notice dem',
    'sidebar.landlord_leads': 'Leads',
    'sidebar.microsite': 'Microsite',
    'sidebar.referrals': 'Refer Person, Chop Money',
    'sidebar.sale_listings': 'House wey dey sale',
    'sidebar.buyer_leads': 'Buyer wey fit buy',
    'sidebar.investment_analytics': 'Investment analytics',
    'sidebar.users': 'User dem',
    'sidebar.disputes': 'Wahala dem',
    'sidebar.fraud_risk': 'Fraud & Risk',
    'sidebar.escrow_oversight': 'Escrow oversight',
    'sidebar.audit_logs': 'Audit logs',
    'sidebar.reports': 'Report dem',
    'sidebar.access_roles': 'Access & Roles',
    'sidebar.clients': 'Client dem',
    'sidebar.leads': 'Lead dem',
    'sidebar.viewings': 'Viewing dem',
    'sidebar.commissions': 'Commission dem',
    'sidebar.tasks': 'Task dem',
    'sidebar.inspections': 'Inspection dem',
    'sidebar.sync_center': 'Sync centre',
    'sidebar.saved_properties': 'House Wey I Save',
    'sidebar.viewing_requests': 'Viewing wey dem request',
    'sidebar.land_marketplace': 'Land market',
    'sidebar.land_purchases': 'My land',
    'sidebar.shortlets': 'Shortlet',
    'sidebar.shortlet_bookings': 'My booking dem',
    'dashboard.greeting_morning': 'Good morning o',
    'dashboard.greeting_afternoon': 'Good afternoon o',
    'dashboard.greeting_evening': 'Good evening o',
    'dashboard.subtitle': 'See wetin dey happen with your house matter today.',
    'dashboard.find_property': 'Find house',
    'dashboard.stats.saved_properties': 'House Wey I Save',
    'dashboard.stats.saved_properties_subtitle': 'For your house search',
    'dashboard.stats.active_applications': 'Application wey dey run',
    'dashboard.stats.active_applications_subtitle': 'For house matter',
    'dashboard.stats.unread_messages': 'Message Wey I No Read',
    'dashboard.stats.unread_messages_subtitle': 'Across your conversations',
    'dashboard.stats.viewings_scheduled': 'Viewing wey dey come',
    'dashboard.stats.viewings_scheduled_subtitle': 'Dis week',
    'dashboard.stats.current_lease': 'Agreement wey dey now',
    'dashboard.stats.current_lease_subtitle': 'Agreement wey dey run',
    'dashboard.stats.total_rent_paid': 'Total Rent Wey I Don Pay',
    'dashboard.stats.total_rent_paid_subtitle': 'From day one',
    'dashboard.applications.title': 'My application dem',
    'dashboard.applications.subtitle': 'Follow your application dem',
    'dashboard.applications.view_all': 'See all',
    'dashboard.trust_score.title': 'Your trust score',
    'dashboard.trust_score.subtitle': 'Build your trust make you fit unlock more feature',
    'dashboard.trust_score.improve_button': 'Make your trust score better',
    'language.switch_language': 'Change language',
  },
};
