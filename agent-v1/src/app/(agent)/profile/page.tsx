'use client'

import { useState, useEffect } from 'react'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFormWrapper } from '@/components/ui/dialog-form-wrapper'
import { Edit, Save, X, Upload, Trash2, Loader2, AlertCircle, LayoutDashboard } from 'lucide-react'
import { DocumentsSection } from './documents-section'
import { AccountsSection } from './accounts-section'
import { toast } from 'sonner'
import { useUpdateProfile, useUploadProfilePhoto, useDeleteProfilePhoto } from '@/app/data/mutations/agent/profile'
import Link from 'next/link'

interface FormErrors {
  name?: string
  email?: string
  phone?: string
}

const ProfilePage = () => {
  const { user, getInitials } = useAgentAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  })

  const { mutateAsync: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile()
  const { mutateAsync: uploadPhoto, isPending: isUploadingPhoto } = useUploadProfilePhoto()
  const { mutateAsync: deletePhoto, isPending: isDeletingPhoto } = useDeleteProfilePhoto()

  // Sync form data with user data when user data changes
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
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

    if (!editForm.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else {
      // Clean the phone number by removing spaces, dashes, and parentheses
      const cleanPhone = editForm.phone.replace(/[\s\-\(\)]/g, '')
      
      // Philippine phone number validation
      // Accepts: 09xxxxxxxxx, +639xxxxxxxxx, 639xxxxxxxxx, or international format
      const phoneRegex = /^(\+?63|0)?[9]\d{9}$|^[\+]?[1-9][\d]{7,15}$/
      
      if (!phoneRegex.test(cleanPhone)) {
        errors.phone = 'Please enter a valid phone number'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form to current user data when canceling
      setEditForm({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || ''
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

    try {
      await updateProfile(editForm)
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      setFormErrors({})
      
      // The user data in the store is automatically updated by the mutation
      // No need to manually refresh since the component will re-render with new data
    } catch (error) {
      toast.error('Failed to update profile')
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
    if (!selectedImage) return

    try {
      const result = await uploadPhoto(selectedImage)
      
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
    try {
      await deletePhoto()
      
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
            Profile Information
          </h3>
          
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/">
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
            <div className="grid gap-4 lg:grid-cols-3">
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
                    {user?.name}
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
                    {user?.email}
                  </h2>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                {isEditing ? (
                  <div className="space-y-1">
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => {
                        setEditForm(prev => ({ ...prev, phone: e.target.value }))
                        if (formErrors.phone) {
                          setFormErrors(prev => ({ ...prev, phone: undefined }))
                        }
                      }}
                      className={formErrors.phone ? 'border-destructive' : ''}
                      disabled={isUpdatingProfile}
                      placeholder="Enter your phone number"
                    />
                    {formErrors.phone && (
                      <p className="text-destructive text-sm flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.phone}
                      </p>
                    )}
                  </div>
                ) : (
                  <h2 className="text-lg font-bold md:text-xl lg:text-2xl">
                    {user?.phone}
                  </h2>
                )}
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

      <DocumentsSection />
      <AccountsSection />
    </div>
  )
}

export default ProfilePage
