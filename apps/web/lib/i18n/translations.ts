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
  | 'sidebar.documents'
  | 'sidebar.legal_resources'
  | 'sidebar.roommates'
  | 'sidebar.trust_score'
  | 'sidebar.credit_report'
  | 'sidebar.ussd_access'
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
  | 'sidebar.home_management'
  | 'sidebar.realtor_access'
  | 'sidebar.transactions'
  | 'sidebar.units'
  | 'sidebar.tenants'
  | 'sidebar.leases'
  | 'sidebar.vendors'
  | 'sidebar.financials'
  | 'sidebar.owner_statements'
  | 'sidebar.arrears'
  | 'sidebar.evictions'
  | 'sidebar.landlord_leads'
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
    'sidebar.my_lease': 'My Lease',
    'sidebar.payments': 'Payments',
    'sidebar.flex_financing': 'Flex Financing',
    'sidebar.my_home': 'My Home',
    'sidebar.maintenance': 'Maintenance',
    'sidebar.messages': 'Messages',
    'sidebar.documents': 'Documents',
    'sidebar.legal_resources': 'Legal Resources',
    'sidebar.roommates': 'Roommates',
    'sidebar.trust_score': 'Trust Score',
    'sidebar.credit_report': 'Credit Report',
    'sidebar.ussd_access': 'USSD Access',
    'sidebar.notifications': 'Notifications',
    'sidebar.calendar': 'Calendar',
    'sidebar.settings': 'Settings',
    'sidebar.help': 'Help',
    'sidebar.properties': 'Properties',
    'sidebar.listings': 'Listings',
    'sidebar.offers': 'Offers',
    'sidebar.reviews': 'Reviews',
    'sidebar.trust_profile': 'Trust Profile',
    'sidebar.verifications': 'Verifications',
    'sidebar.home_management': 'Home Management',
    'sidebar.realtor_access': 'Realtor Access',
    'sidebar.transactions': 'Transactions',
    'sidebar.units': 'Units',
    'sidebar.tenants': 'Tenants',
    'sidebar.leases': 'Leases',
    'sidebar.vendors': 'Vendors',
    'sidebar.financials': 'Financials',
    'sidebar.owner_statements': 'Owner Statements',
    'sidebar.arrears': 'Arrears',
    'sidebar.evictions': 'Evictions',
    'sidebar.landlord_leads': 'Leads',
    'sidebar.sale_listings': 'Sale Listings',
    'sidebar.buyer_leads': 'Buyer Leads',
    'sidebar.investment_analytics': 'Investment Analytics',
    'sidebar.users': 'Users',
    'sidebar.disputes': 'Disputes',
    'sidebar.fraud_risk': 'Fraud & Risk',
    'sidebar.escrow_oversight': 'Escrow Oversight',
    'sidebar.audit_logs': 'Audit Logs',
    'sidebar.reports': 'Reports',
    'sidebar.access_roles': 'Access & Roles',
    'sidebar.clients': 'Clients',
    'sidebar.leads': 'Leads',
    'sidebar.viewings': 'Viewings',
    'sidebar.commissions': 'Commissions',
    'sidebar.tasks': 'Tasks',
    'sidebar.inspections': 'Inspections',
    'sidebar.sync_center': 'Sync Center',
    'sidebar.saved_properties': 'Saved Properties',
    'sidebar.viewing_requests': 'Viewing Requests',
    'sidebar.land_marketplace': 'Land Marketplace',
    'sidebar.shortlets': 'Shortlets',
    'sidebar.shortlet_bookings': 'My Bookings',
    'dashboard.greeting_morning': 'Good morning',
    'dashboard.greeting_afternoon': 'Good afternoon',
    'dashboard.greeting_evening': 'Good evening',
    'dashboard.subtitle': "Here's what's happening with your rentals today.",
    'dashboard.find_property': 'Find Property',
    'dashboard.stats.saved_properties': 'Saved Properties',
    'dashboard.stats.saved_properties_subtitle': 'In your shortlist',
    'dashboard.stats.active_applications': 'Active Applications',
    'dashboard.stats.active_applications_subtitle': 'In your pipeline',
    'dashboard.stats.unread_messages': 'Unread Messages',
    'dashboard.stats.unread_messages_subtitle': 'Across conversations',
    'dashboard.stats.viewings_scheduled': 'Viewings Scheduled',
    'dashboard.stats.viewings_scheduled_subtitle': 'This week',
    'dashboard.stats.current_lease': 'Current Lease',
    'dashboard.stats.current_lease_subtitle': 'Active lease',
    'dashboard.stats.total_rent_paid': 'Total Rent Paid',
    'dashboard.stats.total_rent_paid_subtitle': 'Lifetime',
    'dashboard.applications.title': 'My Applications',
    'dashboard.applications.subtitle': 'Track your rental applications',
    'dashboard.applications.view_all': 'View All',
    'dashboard.trust_score.title': 'Your Trust Score',
    'dashboard.trust_score.subtitle': 'Build trust to unlock more features',
    'dashboard.trust_score.improve_button': 'Improve Your Trust Score',
    'language.switch_language': 'Switch language',
  },
  pcm: {
    'nav.dashboard': 'Dashboard',
    'nav.discover': 'Find House',
    'nav.search_placeholder': 'Find house, area, wey you want...',
    'sidebar.dashboard': 'Dashboard',
    'sidebar.discover': 'Find House',
    'sidebar.saved': 'Wey I Save',
    'sidebar.applications': 'Application Dem',
    'sidebar.my_lease': 'My Agreement',
    'sidebar.payments': 'Payment Dem',
    'sidebar.flex_financing': 'Flex Loan',
    'sidebar.my_home': 'My House',
    'sidebar.maintenance': 'Repair Matter',
    'sidebar.messages': 'Message Dem',
    'sidebar.documents': 'Paper Dem',
    'sidebar.legal_resources': 'Law Matter',
    'sidebar.roommates': 'House People',
    'sidebar.trust_score': 'Trust Score',
    'sidebar.credit_report': 'Credit Report',
    'sidebar.ussd_access': 'USSD Code',
    'sidebar.notifications': 'Notification Dem',
    'sidebar.calendar': 'Calendar',
    'sidebar.settings': 'Settings',
    'sidebar.help': 'Help',
    'sidebar.properties': 'Property Dem',
    'sidebar.listings': 'Listing Dem',
    'sidebar.offers': 'Offer Dem',
    'sidebar.reviews': 'Review Dem',
    'sidebar.trust_profile': 'Trust Profile',
    'sidebar.verifications': 'Verification Dem',
    'sidebar.home_management': 'House Management',
    'sidebar.realtor_access': 'Realtor Access',
    'sidebar.transactions': 'Transaction Dem',
    'sidebar.units': 'Unit Dem',
    'sidebar.tenants': 'Tenant Dem',
    'sidebar.leases': 'Agreement Dem',
    'sidebar.vendors': 'Vendor Dem',
    'sidebar.financials': 'Money Matter',
    'sidebar.owner_statements': 'Owner Statement Dem',
    'sidebar.arrears': 'Rent Wey Dem Owe',
    'sidebar.evictions': 'Comot-For-House Case',
    'sidebar.landlord_leads': 'Leads',
    'sidebar.sale_listings': 'House Wey Dey Sale',
    'sidebar.buyer_leads': 'Buyer Wey Fit Buy',
    'sidebar.investment_analytics': 'Investment Analytics',
    'sidebar.users': 'User Dem',
    'sidebar.disputes': 'Wahala Dem',
    'sidebar.fraud_risk': 'Fraud & Risk',
    'sidebar.escrow_oversight': 'Escrow Oversight',
    'sidebar.audit_logs': 'Audit Logs',
    'sidebar.reports': 'Report Dem',
    'sidebar.access_roles': 'Access & Roles',
    'sidebar.clients': 'Client Dem',
    'sidebar.leads': 'Lead Dem',
    'sidebar.viewings': 'Viewing Dem',
    'sidebar.commissions': 'Commission Dem',
    'sidebar.tasks': 'Task Dem',
    'sidebar.inspections': 'Inspection Dem',
    'sidebar.sync_center': 'Sync Center',
    'sidebar.saved_properties': 'House Wey I Save',
    'sidebar.viewing_requests': 'Viewing Wey Dem Request',
    'sidebar.land_marketplace': 'Land Market',
    'sidebar.shortlets': 'Shortlet',
    'sidebar.shortlet_bookings': 'My Booking Dem',
    'dashboard.greeting_morning': 'Good morning o',
    'dashboard.greeting_afternoon': 'Good afternoon o',
    'dashboard.greeting_evening': 'Good evening o',
    'dashboard.subtitle': 'See wetin dey happen with your house matter today.',
    'dashboard.find_property': 'Find House',
    'dashboard.stats.saved_properties': 'House Wey I Save',
    'dashboard.stats.saved_properties_subtitle': 'For your house search',
    'dashboard.stats.active_applications': 'Application Wey Dey Run',
    'dashboard.stats.active_applications_subtitle': 'For house matter',
    'dashboard.stats.unread_messages': 'Message Wey I No Read',
    'dashboard.stats.unread_messages_subtitle': 'Across your conversations',
    'dashboard.stats.viewings_scheduled': 'Viewing Wey Dey Come',
    'dashboard.stats.viewings_scheduled_subtitle': 'Dis week',
    'dashboard.stats.current_lease': 'Agreement Wey Dey Now',
    'dashboard.stats.current_lease_subtitle': 'Agreement wey dey run',
    'dashboard.stats.total_rent_paid': 'Total Rent Wey I Don Pay',
    'dashboard.stats.total_rent_paid_subtitle': 'From Day One',
    'dashboard.applications.title': 'My Application Dem',
    'dashboard.applications.subtitle': 'Follow your application dem',
    'dashboard.applications.view_all': 'See All',
    'dashboard.trust_score.title': 'Your Trust Score',
    'dashboard.trust_score.subtitle': 'Build your trust make you fit unlock more feature',
    'dashboard.trust_score.improve_button': 'Make Your Trust Score Better',
    'language.switch_language': 'Change language',
  },
};
