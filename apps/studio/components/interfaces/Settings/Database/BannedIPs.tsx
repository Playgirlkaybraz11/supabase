import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { FormHeader, FormPanel } from 'components/ui/Forms'
import { useBannedIPsDeleteMutation } from 'data/banned-ips/banned-ips-delete-mutations'
import { useBannedIPsQuery } from 'data/banned-ips/banned-ips-query'
import { useCheckPermissions } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { Globe } from 'lucide-react'
import {
  Badge,
  Button,
  IconExternalLink,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'

const BannedIPs = () => {
  const { ref } = useParams()
  const [selectedIPToUnban, setSelectedIPToUnban] = useState<string | null>(null) // Track the selected IP for unban
  const { data: ipList } = useBannedIPsQuery({
    projectRef: ref,
  })

  const [showUnban, setShowUnban] = useState(false)
  const [confirmingIP, setConfirmingIP] = useState<string | null>(null) // Track the IP being confirmed for unban

  const canUnbanNetworks = useCheckPermissions(PermissionAction.UPDATE, 'projects')

  const { mutate: unbanIPs, isLoading: isUnbanning } = useBannedIPsDeleteMutation({
    onSuccess: () => {
      toast.success('IP address successfully unbanned')
      setSelectedIPToUnban(null) // Reset the selected IP for unban
      setShowUnban(false)
    },
    onError: (error) => {
      toast.error(`Failed to unban IP: ${error?.message}`)
    },
  })

  const onConfirmUnbanIP = () => {
    if (confirmingIP == null || !ref) return
    unbanIPs({
      projectRef: ref,
      ips: [confirmingIP], // Pass the IP as an array
    })
  }

  const openConfirmationModal = (ip: string) => {
    setSelectedIPToUnban(ip) // Set the selected IP for unban
    setConfirmingIP(ip) // Set the IP being confirmed for unban
    setShowUnban(true)
  }

  const [userIPAddress, setUserIPAddress] = useState<string | null>(null)

  useEffect(() => {
    // Fetch user's IP address
    fetch(`${BASE_PATH}/api/get-ip-address`)
      .then((response) => response.json())
      .then((data) => setUserIPAddress(data.ipAddress))
  }, [])

  return (
    <div id="banned-ips">
      <div className="flex items-center justify-between">
        <FormHeader
          title="Network Bans"
          description="List of IP addresses that are temporarily blocked if their traffic pattern looks abusive"
        />
        <div className="flex items-center space-x-2 mb-6">
          <Button asChild type="default" icon={<IconExternalLink />}>
            <Link
              href="https://supabase.com/docs/reference/cli/supabase-network-bans"
              target="_blank"
            >
              Documentation
            </Link>
          </Button>
        </div>
      </div>
      <FormPanel>
        {ipList && ipList.banned_ipv4_addresses.length > 0 ? (
          ipList.banned_ipv4_addresses.map((ip) => (
            <div key={ip} className="px-8 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-5">
                <Globe size={16} className="text-foreground-lighter" />
                <p className="text-sm font-mono">{ip}</p>
                {ip === userIPAddress && <Badge>Your IP address</Badge>}
              </div>
              <div>
                <Tooltip_Shadcn_>
                  <TooltipTrigger_Shadcn_ asChild>
                    <Button
                      type="default"
                      className="pointer-events-auto"
                      disabled={!canUnbanNetworks}
                      onClick={() => openConfirmationModal(ip)}
                    >
                      Unban IP
                    </Button>
                  </TooltipTrigger_Shadcn_>
                  {!canUnbanNetworks && (
                    <TooltipContent_Shadcn_>
                      You need additional permissions to unban networks
                    </TooltipContent_Shadcn_>
                  )}
                </Tooltip_Shadcn_>
              </div>
            </div>
          ))
        ) : (
          <p className="text-foreground-light text-sm px-8 py-4">
            There are no banned IP addresses for your project.
          </p>
        )}
      </FormPanel>

      <ConfirmationModal
        variant="destructive"
        size="medium"
        loading={isUnbanning}
        visible={showUnban}
        title="Confirm Unban IP"
        confirmLabel="Confirm Unban"
        confirmLabelLoading="Unbanning..."
        onCancel={() => setShowUnban(false)}
        onConfirm={onConfirmUnbanIP}
        alert={{
          title: 'This action cannot be undone',
          description: `Are you sure you want to unban this IP address ${selectedIPToUnban}?`,
        }}
      />
    </div>
  )
}

export default BannedIPs
