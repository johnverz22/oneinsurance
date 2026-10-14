'use client'

import { FC, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { MessageSquare, MoreVertical, User, XCircle } from 'lucide-react'

interface ClientActivityItem {
  id: number
  name: string
  action: string
  time: string
  avatar: string
}

const clientActivityData: ClientActivityItem[] = [
  {
    id: 1,
    name: 'Elena Rodriguez',
    action: 'sent a message',
    time: '5m ago',
    avatar: 'ER',
  },
  {
    id: 2,
    name: 'John Smith',
    action: 'logged in',
    time: '1h ago',
    avatar: 'JS',
  },
  {
    id: 3,
    name: 'Samantha Chen',
    action: 'renewal due: 2024-07-28',
    time: 'in 3 days',
    avatar: 'SC',
  },
  {
    id: 4,
    name: 'Marcus Holloway',
    action: 'submitted a new application',
    time: 'yesterday',
    avatar: 'MH',
  },
  {
    id: 5,
    name: 'Olivia Williams',
    action: 'uploaded a document',
    time: '2 days ago',
    avatar: 'OW',
  },
]

export const ClientActivity: FC = () => {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleMenuToggle = (id: number) => {
    setOpenMenuId((prevId) => (prevId === id ? null : id))
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement
        if (!target.closest('button[data-menu-button="true"]')) {
          setOpenMenuId(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Client Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {clientActivityData.map((activity) => (
            <li key={activity.id} className="flex items-center space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-bold text-muted-foreground dark:bg-gray-700 dark:text-muted-foreground">
                {activity.avatar}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground dark:text-muted-foreground">
                  {activity.name}{' '}
                  <span className="font-normal text-muted-foreground">
                    {activity.action}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.time}
                </p>
              </div>
              <div
                className="relative"
                ref={openMenuId === activity.id ? menuRef : null}
              >
                <Button
                  variant="ghost"
                  className="h-auto p-2"
                  onClick={() => handleMenuToggle(activity.id)}
                  data-menu-button="true"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                {openMenuId === activity.id && (
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <ul className="py-1">
                      <li>
                        <a
                          href="#"
                          className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-muted dark:text-muted-foreground dark:hover:bg-gray-700"
                        >
                          <User className="mr-2 h-4 w-4" /> View Client
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-muted dark:text-muted-foreground dark:hover:bg-gray-700"
                        >
                          <MessageSquare className="mr-2 h-4 w-4" /> Send
                          Message
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="flex w-full items-center px-4 py-2 text-sm text-destructive hover:bg-destructive/10 dark:hover:bg-red-900/50"
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Dismiss
                        </a>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
