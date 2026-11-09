'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFormWrapper } from '@/components/ui/dialog-form-wrapper'
import { Edit, Save, X, Upload, Trash2, Loader2, AlertCircle, LayoutDashboard } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useUpdateAdminProfile, useUploadAdminProfilePhoto, useDeleteAdminProfilePhoto } from '@/app/data/mutations/admin/profile'

interface FormErrors {
  name?: string
  email?: string
}

const AdminProfilePage = () => {
  const { user, updateUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  })

  const { mutateAsync: updateProfile, isPending: isUpdatingProfile } = useUpdateAdminProfile()
  const { mutateAsync: uploadPhoto, isPending: isUploadingPhoto } = useUploadAdminProfilePhoto()
  const { mutateAsync: deletePhoto, isPending: isDeletingPhoto } = useDeleteAdminProfilePhoto()

  // Get user initials
  const getInitials = () => {
    if (user) {
      return user?.name
        ?.split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
    }
    return ''
  }

  // Sync form data with user data when user data changes
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || ''
      })
    }
  }, [user])

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    if (!editForm.name.trim()) {
      errors.name = 'Name is required'
    }

    if (!editForm.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.email = 'Please enter a valid email address'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form to current user data when canceling
      setEditForm({
        name: user?.name || '',
        email: user?.email || ''
      })
      setFormErrors({})
    }
    setIsEditing(!isEditing)
  }

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving')
      return
    }

    if (!user?.id) {
      toast.error('User ID not found')
      return
    }

    try {
      const response = await updateProfile({
        id: user.id,
        data: editForm
      })
      
      if (response && response.success) {
        toast.success('Profile updated successfully!')
        setIsEditing(false)
        setFormErrors({})
      } else {
        throw new Error('Update failed')
      }
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error(error.message || 'Failed to update profile')
    }
  }

  const handleImageSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setSelectedImage(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handlePhotoUpload = async () => {
    if (!selectedImage || !user?.id) return

    try {
      await uploadPhoto({
        id: user.id,
        file: selectedImage
      })
      
      toast.success('Profile photo updated successfully!')
      setIsPhotoDialogOpen(false)
      setSelectedImage(null)
      setImagePreview(null)
    } catch (error: any) {
      console.error('Photo upload error:', error)
      toast.error(error.message || 'Failed to upload photo')
    }
  }

  const handlePhotoDelete = async () => {
    if (!user?.id) return

    try {
      await deletePhoto(user.id)
      
      toast.success('Profile photo deleted successfully!')
      setIsPhotoDialogOpen(false)
    } catch (error: any) {
      console.error('Photo delete error:', error)
      toast.error(error.message || 'Failed to delete photo')
    }
  }

  const handleDialogClose = () => {
    setIsPhotoDialogOpen(false)
    setSelectedImage(null)
    setImagePreview(null)
  }

  return (
    <div className="relative mx-auto space-y-6 overflow-hidden">
      <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
        <div className="flex items-center justify-between border-b">
          <h3 className="py-4 text-xl font-bold lg:text-2xl">
            Admin Profile Information
          </h3>
          
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleEditToggle} disabled={isUpdatingProfile}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={handleEditToggle}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="px-4 py-4 lg:px-16">
          <div className="flex w-full flex-col gap-5">
            {/* Profile Photo Section */}
            <div className="relative">
              <Avatar 
                className="size-32 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsPhotoDialogOpen(true)}
              >
                {user?.profile_photo_url && <AvatarImage src={user.profile_photo_url} />}
                <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
              </Avatar>
            </div>

            {/* Profile Information */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                {isEditing ? (
                  <div className="space-y-1">
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => {
                        setEditForm(prev => ({ ...prev, name: e.target.value }))
                        if (formErrors.name) {
                          setFormErrors(prev => ({ ...prev, name: undefined }))
                        }
                      }}
                      className={formErrors.name ? 'border-destructive' : ''}
                      disabled={isUpdatingProfile}
                      placeholder="Enter your name"
                    />
                    {formErrors.name && (
                      <p className="text-destructive text-sm flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.name}
                      </p>
                    )}
                  </div>
                ) : (
                  <h2 className="text-lg font-bold md:text-xl lg:text-2xl">
                    {user?.name || 'N/A'}
                  </h2>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <div className="space-y-1">
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => {
                        setEditForm(prev => ({ ...prev, email: e.target.value }))
                        if (formErrors.email) {
                          setFormErrors(prev => ({ ...prev, email: undefined }))
                        }
                      }}
                      className={formErrors.email ? 'border-destructive' : ''}
                      disabled={isUpdatingProfile}
                      placeholder="Enter your email"
                    />
                    {formErrors.email && (
                      <p className="text-destructive text-sm flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                ) : (
                  <h2 className="text-lg font-bold md:text-xl lg:text-2xl">
                    {user?.email || 'N/A'}
                  </h2>
                )}
              </div>
            </div>

            {/* Additional Admin Info */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <h2 className="text-lg font-bold md:text-xl lg:text-2xl">
                  {user?.role || 'N/A'}
                </h2>
              </div>
              
              <div className="space-y-2">
                <Label>Designation</Label>
                <h2 className="text-lg font-bold md:text-xl lg:text-2xl">
                  {user?.designation || 'N/A'}
                </h2>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <h2 className="text-lg font-bold md:text-xl lg:text-2xl">
                  {user?.status || 'N/A'}
                </h2>
              </div>
              
              <div className="space-y-2">
                <Label>Member Since</Label>
                <h2 className="text-lg font-bold md:text-xl lg:text-2xl">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Management Dialog */}
      <DialogFormWrapper
        title="Profile Photo"
        open={isPhotoDialogOpen}
        showTrigger={false}
        setOpen={handleDialogClose}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <Avatar className="size-24">
              {(imagePreview || user?.profile_photo_url) && (
                <AvatarImage src={imagePreview || user?.profile_photo_url || ""} />
              )}
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
          </div>
          
          {selectedImage && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                New photo selected: {selectedImage.name}
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="photo-upload" className="cursor-pointer">
              <Button asChild className="w-full" disabled={isUploadingPhoto}>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose New Photo
                </span>
              </Button>
            </Label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploadingPhoto}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageSelect(file)
              }}
            />
            
            {selectedImage && (
              <Button 
                onClick={handlePhotoUpload}
                disabled={isUploadingPhoto}
                className="w-full"
              >
                {isUploadingPhoto ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Photo
                  </>
                )}
              </Button>
            )}
            
            <Button 
              variant="destructive" 
              onClick={handlePhotoDelete}
              disabled={isDeletingPhoto}
              className="w-full"
            >
              {isDeletingPhoto ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Profile Picture
                </>
              )}
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            Supported formats: JPG, PNG, GIF. Max size: 5MB
          </div>
        </div>
      </DialogFormWrapper>
    </div>
  )
}

export default AdminProfilePage