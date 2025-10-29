import getInTouch from '@/app/actions'
import { cn } from '@/ui/cn'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'

// Create properly typed motion components
const MotionDiv = motion.div as any;
const MotionForm = motion.form as any;

// Types
interface ContactFormData {
  companyName: string
  fullName: string
  message: string
  email: string
  mobile: string
  website: string
  currentERP: string
}

interface FormErrors {
  companyName?: string
  fullName?: string
  message?: string
  email?: string
  mobile?: string
  website?: string
  currentERP?: string
}

interface InputFieldProps {
  label: string
  type?: string
  placeholder: string
  name: string,
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  maxWidth?: string
  required?: boolean,
  className?: string
}

interface ContactFormProps {
  onSubmit: (data: FormData) => void
  setContacting: Function
}

interface ContactProps {
  contacting?: boolean
  setContacting: Function
}

// Input Field Component
const InputField: React.FC<InputFieldProps> = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  maxWidth,
  className,
  name,
  required = false
}) => {
  return (
    <div className={cn("flex flex-col gap-1 md:gap-2", className)}>
      <span className='text-base md:text-xl ml-3.5'>
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        type={type}
        value={value}
        name={name}
        onChange={onChange}
        className={`outline-none bg-black/[.08] py-3 px-3.5 text-xl md:text-2xl rounded-[70px] w-full ${maxWidth || ''} ${error ? 'ring-2 ring-red-500' : ''}`}
        placeholder={placeholder}
      />
      {error && <span className="text-red-500 text-sm ml-3.5">{error}</span>}
    </div>
  )
}

// Success Message Component
const SuccessMessage: React.FC = () => {
  return (
    <MotionDiv
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative bg-white rounded-[70px] w-full max-w-[clamp(640px,70vw,800px)] h-fit p-16 text-[#142533] pointer-events-auto mx-2 flex flex-col items-center gap-8 text-center"
    >
      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-semibold text-[#3C466F]">Thank you for reaching out!</h2>
        <p className="text-xl text-gray-600 leading-relaxed">
          We&apos;ve received your message and our team will get back to you within 24-48 hours.
          Please check your email for a confirmation.
        </p>
        <p className="text-lg text-gray-500">
          Need immediate assistance? Call us at <span className="font-semibold">+91 8077366062</span>
        </p>
      </div>
    </MotionDiv>
  )
}

// Main Contact Form Component
const ContactForm: React.FC<ContactFormProps> = ({ onSubmit, setContacting }) => {
  const [formData, setFormData] = useState<ContactFormData>({
    companyName: '',
    fullName: '',
    message: '',
    email: '',
    mobile: '',
    website: '',
    currentERP: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateMobile = (mobile: string) => {
    const mobileRegex = /^(\+91[\s-]?)?[6-9]\d{9}$/
    return mobileRegex.test(mobile.replace(/\s/g, ''))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required'
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.mobile && !validateMobile(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid mobile number'
    }

    if (formData.website && !formData.website.includes('.')) {
      newErrors.website = 'Please enter a valid website URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof ContactFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }


  return (
    <MotionForm
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      action={(fd: FormData) => {
        if (validateForm()) onSubmit(fd);
      }}
      className='relative bg-white rounded-[70px] max-md:rounded-[40px] w-full max-w-[clamp(640px,70vw,1400px)] h-fit p-10 max-md:p-6 text-[#142533] pointer-events-auto mx-2 max-h-[calc(100svh-1rem)] overflow-auto flex flex-col gap-4 md:gap-10'
      data-lenis-prevent
    >
      <div className="flex flex-1 gap-6 max-xl:gap-2 max-xl:flex-col-reverse">
        <div className="flex flex-col gap-8 flex-1 max-md:gap-4">
          <InputField
            label="Company Name"
            placeholder="eg. DeVolt Solutions"
            value={formData.companyName}
            onChange={handleInputChange('companyName')}
            name='companyName'
            error={errors.companyName}
            maxWidth="max-w-[686px]"
            required
          />

          <div className="flex gap-14 max-xl:gap-8 max-lg:gap-6 max-md:flex-col max-md:gap-4">
            <InputField
              label="Your Full Name"
              placeholder="eg. Vishal Singh"
              value={formData.fullName}
              className='flex-1'
              onChange={handleInputChange('fullName')}
              name='fullName'
              error={errors.fullName}
              maxWidth="max-w-[600px]"
              required
            />
            <InputField
              label="Email Address"
              type="email"
              className='flex-1 max-md:flex-auto'
              placeholder="eg. contact@decharge.network"
              value={formData.email}
              onChange={handleInputChange('email')}
              name='email'
              error={errors.email}
              maxWidth="md:max-w-[520px]"
              required
            />
          </div>

          <div className="flex gap-14 max-xl:gap-8 max-lg:gap-6 max-md:flex-col max-md:gap-4">
            <InputField
              label="Mobile No."
              type="tel"
              className='flex-1'
              placeholder="eg. +91 8077366062"
              value={formData.mobile}
              onChange={handleInputChange('mobile')}
              name='mobile'
              error={errors.mobile}
            />

            <InputField
              label="Company Website"
              placeholder="eg. decharge.network"
              className='flex-1'
              value={formData.website}
              onChange={handleInputChange('website')}
              name='website'
              error={errors.website}
            />
            <div className="flex flex-col gap-2 relative max-md:mb-5 flex-1">
              <InputField
                label="Current ERP System"
                placeholder="eg. Tally"
                value={formData.currentERP}
                onChange={handleInputChange('currentERP')}
                name='currentERP'
                error={errors.currentERP}
              />
              <span className='text-lg ml-3.5 -mt-2 text-gray-600 absolute -bottom-6 md:-bottom-8'>Leave blank if none.</span>
            </div>
          </div>

          <div className={cn("flex flex-col gap-1 md:gap-2")}>
            <span className='text-base md:text-xl ml-3.5'>
              Message <span className="text-red-500">*</span>
            </span>
            <textarea
              value={formData.message}
              name={"message"}
              onChange={handleInputChange('message')}
              className={`outline-none bg-black/[.08] py-3 px-3.5 text-xl md:text-2xl rounded-[25px] w-full resize-none h-32 ${errors.message ? 'ring-2 ring-red-500' : ''}`}
              placeholder={"Your Words..."}
            />
            {errors.message && <span className="text-red-500 text-sm ml-3.5">{errors.message}</span>}
          </div>
        </div>

        <div className="flex">
          <div className="size-12 rounded-full cursor-pointer ml-auto" onClick={() => setContacting(false)}>
            <svg className='size-12'>
              <path d="M12.03 12.03 L35.97 35.97 M12.03 35.97 L35.97 12.03" strokeLinecap='round' stroke='#142533' strokeWidth={3} />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex">
        <SubmitButton />
      </div>
    </MotionForm>
  )
}

const SubmitButton = () => {

  const { pending: isSubmitting } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={`ml-auto py-3 w-full max-w-[180px] rounded-full text-white text-2xl transition-all duration-200 ${isSubmitting
        ? 'bg-gray-400 cursor-not-allowed'
        : 'bg-[#3C466F] hover:bg-[#2d3555] active:scale-95'
        }`}
    >
      <span className='relative -top-[1.5px]'>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </span>
    </button>
  )
}



// Main Contact Component
const Contact: React.FC<ContactProps> = ({ contacting = false, setContacting }) => {
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  useEffect(() => {
    // window.setContacting = setContacting
    setHasSubmitted(Boolean(localStorage.getItem("__CONTACTSUBMITTED")))
  }, [contacting])

  const handleSubmit = async (formData: FormData): Promise<void> => {
    try {
      const mail_response = await getInTouch(formData);

      if (mail_response) {
        setHasSubmitted(true);
        localStorage.setItem("__CONTACTSUBMITTED", "true");
      } else {}
    } catch (error) {
      console.error('Submission error:', error)
    } finally { }
  }

  const handleReset = (): void => {
    setContacting(false);
  }

  return (
    <div className="fixed w-full h-dvh left-0 right-0 bottom-0 top-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 16000 }}>
      <AnimatePresence>
        {contacting && (
          <>
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ease: 'easeOut' }}
              style={{
                background: 'hsla(207 9 35 / 50%)',
                backdropFilter: 'blur(8px)',
              }}
              className="backdrop absolute inset-0 h-lvh pointer-events-auto"
              onClick={hasSubmitted ? handleReset : undefined}
            />

            {hasSubmitted ? (
              <SuccessMessage />
            ) : (
              <ContactForm onSubmit={handleSubmit} setContacting={setContacting} />
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Contact