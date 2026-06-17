import {
  LayoutDashboard,
  FileText,
  Activity,
  PawPrint,
  Users,
  Home,
  HeartPulse,
  TrendingUp,
  Settings,
  Command,
  AudioWaveform,
  GalleryVerticalEnd
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Rescue Admin',
    email: 'admin@rescuehub.org',
    avatar: '',
  },
  teams: [
    {
      name: 'RescueHub HQ',
      logo: Command,
      plan: 'Operations Portal',
    },
    {
      name: 'Green Valley',
      logo: GalleryVerticalEnd,
      plan: 'Sanctuary Node',
    },
    {
      name: 'Safe Haven',
      logo: AudioWaveform,
      plan: 'Shelter Node',
    },
  ],
  navGroups: [
    {
      title: 'Operations',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Incident Reports',
          url: '/incident-reports',
          icon: FileText,
        },
        {
          title: 'Rescue Cases',
          url: '/rescue-cases',
          icon: Activity,
        },
        {
          title: 'Animals Register',
          url: '/animals',
          icon: PawPrint,
        },
      ],
    },
    {
      title: 'Resources',
      items: [
        {
          title: 'Rescuers Roster',
          url: '/rescuers',
          icon: Users,
        },
        {
          title: 'Shelters & Capacity',
          url: '/shelters',
          icon: Home,
        },
        {
          title: 'Medical Treatments',
          url: '/treatments',
          icon: HeartPulse,
        },
      ],
    },
    {
      title: 'Analytics',
      items: [
        {
          title: 'Performance Reports',
          url: '/reports',
          icon: TrendingUp,
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          title: 'Settings',
          url: '/settings',
          icon: Settings,
        },
      ],
    },
  ],
}
