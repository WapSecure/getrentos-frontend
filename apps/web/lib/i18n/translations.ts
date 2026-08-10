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
  | 'sidebar.maintenance'
  | 'sidebar.messages'
  | 'sidebar.documents'
  | 'sidebar.roommates'
  | 'sidebar.trust_score'
  | 'sidebar.credit_report'
  | 'sidebar.ussd_access'
  | 'sidebar.notifications'
  | 'sidebar.calendar'
  | 'sidebar.settings'
  | 'sidebar.help'
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
    'sidebar.maintenance': 'Maintenance',
    'sidebar.messages': 'Messages',
    'sidebar.documents': 'Documents',
    'sidebar.roommates': 'Roommates',
    'sidebar.trust_score': 'Trust Score',
    'sidebar.credit_report': 'Credit Report',
    'sidebar.ussd_access': 'USSD Access',
    'sidebar.notifications': 'Notifications',
    'sidebar.calendar': 'Calendar',
    'sidebar.settings': 'Settings',
    'sidebar.help': 'Help',
    'dashboard.greeting_morning': 'Good morning',
    'dashboard.greeting_afternoon': 'Good afternoon',
    'dashboard.greeting_evening': 'Good evening',
    'dashboard.subtitle': "Here's what's happening with your rentals today.",
    'dashboard.find_property': 'Find Property',
    'dashboard.stats.saved_properties': 'Saved Properties',
    'dashboard.stats.saved_properties_subtitle': '3 new this week',
    'dashboard.stats.active_applications': 'Active Applications',
    'dashboard.stats.active_applications_subtitle': '2 under review',
    'dashboard.stats.unread_messages': 'Unread Messages',
    'dashboard.stats.unread_messages_subtitle': 'From 3 landlords',
    'dashboard.stats.viewings_scheduled': 'Viewings Scheduled',
    'dashboard.stats.viewings_scheduled_subtitle': 'This week',
    'dashboard.stats.current_lease': 'Current Lease',
    'dashboard.stats.current_lease_subtitle': 'Ends Dec 2024',
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
    'sidebar.maintenance': 'Repair Matter',
    'sidebar.messages': 'Message Dem',
    'sidebar.documents': 'Paper Dem',
    'sidebar.roommates': 'House People',
    'sidebar.trust_score': 'Trust Score',
    'sidebar.credit_report': 'Credit Report',
    'sidebar.ussd_access': 'USSD Code',
    'sidebar.notifications': 'Notification Dem',
    'sidebar.calendar': 'Calendar',
    'sidebar.settings': 'Settings',
    'sidebar.help': 'Help',
    'dashboard.greeting_morning': 'Good morning o',
    'dashboard.greeting_afternoon': 'Good afternoon o',
    'dashboard.greeting_evening': 'Good evening o',
    'dashboard.subtitle': 'See wetin dey happen with your house matter today.',
    'dashboard.find_property': 'Find House',
    'dashboard.stats.saved_properties': 'House Wey I Save',
    'dashboard.stats.saved_properties_subtitle': '3 new one dis week',
    'dashboard.stats.active_applications': 'Application Wey Dey Run',
    'dashboard.stats.active_applications_subtitle': '2 dem dey check am',
    'dashboard.stats.unread_messages': 'Message Wey I No Read',
    'dashboard.stats.unread_messages_subtitle': 'From 3 landlord dem',
    'dashboard.stats.viewings_scheduled': 'Viewing Wey Dey Come',
    'dashboard.stats.viewings_scheduled_subtitle': 'Dis week',
    'dashboard.stats.current_lease': 'Agreement Wey Dey Now',
    'dashboard.stats.current_lease_subtitle': 'E go end Dec 2024',
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
