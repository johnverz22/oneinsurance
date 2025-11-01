import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar'

export default function ClientPortalSidebar() {
  return (
    <Sidebar>
      <SidebarTrigger />
      <SidebarContent className="pt-15">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>My Policies</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
