import React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Flag, BarChart3, Calendar, User } from 'lucide-react'

interface StandardNavigationProps {
  currentPage?: string
  onNavigate?: ((page: string) => void) | null
}

interface NavItem {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  action: () => void
}

/**
 * Standardized 5-Icon Navigation Component
 * 
 * Fixed order: Plus → Flag → BarChart3 → Calendar → User
 * Shows all 5 icons with current page highlighted (lighter opacity)
 * 
 * @param currentPage - 'dashboard', 'goals', 'weekly', 'history', 'profile'
 * @param onNavigate - Optional callback for custom navigation (used by AthleticTracker state-based views)
 */
const StandardNavigation: React.FC<StandardNavigationProps> = ({ 
  currentPage = '', 
  onNavigate = null 
}) => {
  const router = useRouter()
  
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      icon: Plus,
      title: 'Add Workout',
      action: () => onNavigate ? onNavigate('log') : router.push('/')
    },
    {
      id: 'goals', 
      icon: Flag,
      title: 'Goals',
      action: () => onNavigate ? onNavigate('goals') : router.push('/?view=goals')
    },
    {
      id: 'weekly',
      icon: BarChart3, 
      title: 'Weekly View',
      action: () => onNavigate ? onNavigate('weekly') : router.push('/weekly-view')
    },
    {
      id: 'history',
      icon: Calendar,
      title: 'History', 
      action: () => onNavigate ? onNavigate('history') : router.push('/history')
    },
    {
      id: 'profile',
      icon: User,
      title: 'Profile',
      action: () => onNavigate ? onNavigate('profile') : router.push('/?view=profile')
    }
  ]
  
  return (
    <div className="flex space-x-2">
      {navItems.map((item) => {
        const Icon = item.icon
        const isCurrent = currentPage === item.id
        
        return (
          <button
            key={item.id}
            onClick={item.action}
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 hover:bg-opacity-20 transition-all duration-200 touch-manipulation"
            title={item.title}
          >
            <Icon 
              className={`w-5 h-5 sm:w-6 sm:h-6 ${
                isCurrent ? 'text-white text-opacity-60' : 'text-white'
              }`} 
            />
          </button>
        )
      })}
    </div>
  )
}

export default StandardNavigation