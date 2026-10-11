import React,{useState} from 'react'
import {useNavigate} from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'

import {

User,
Mail,
Lock,
UserPlus,
Eye,
EyeOff,
Sprout,
Shield,
Zap,
ArrowLeft,
CheckCircle

} from 'lucide-react'

const BimaSetuSignup=()=>{

const navigate=useNavigate()
const { signUpWithEmail, loginWithGoogle } = useAuth()
const { t } = useLanguage()

const [formData,setFormData]=useState({

fullName:'',
email:'',
password:'',
confirmPassword:''

})

const [errors,setErrors]=useState({})

const [showPassword,setShowPassword]=useState(false)

const [showConfirmPassword,setShowConfirmPassword]=useState(false)

const [isLoading,setIsLoading]=useState(false)

const [showSuccess,setShowSuccess]=useState(false)

const validateForm=()=>{

const newErrors={}

if(!formData.fullName.trim()){

newErrors.fullName=t('auth.enterFullName')

}

if(!formData.email.trim()){

newErrors.email=t('auth.enterEmail')

}

else if(

!/^\S+@\S+\.\S+$/.test(

formData.email

)

){

newErrors.email=t('auth.validEmail')

}

if(!formData.password){

newErrors.password=t('auth.enterPassword')

}

else if(

formData.password.length<6

){

newErrors.password=

t('auth.minPassword')

}

if(

!formData.confirmPassword

){

newErrors.confirmPassword=

t('auth.confirmPwd')

}

else if(

formData.password!==

formData.confirmPassword

){

newErrors.confirmPassword=

t('auth.pwdMismatch')

}

setErrors(newErrors)

return Object.keys(

newErrors

).length===0

}

const handleSignup=async(e)=>{

e.preventDefault()

setErrors({})

if(

!validateForm()

){

return

}

setIsLoading(true)

try {
  await signUpWithEmail(formData.email, formData.password, formData.fullName)
  setShowSuccess(true)
  setTimeout(()=>{
    navigate('/home')
  },1000)
} catch (err) {
  console.error("Signup failed:", err)
  setErrors({ firebase: err.message || 'Failed to sign up. Please try again.' })
} finally {
  setIsLoading(false)
}

}

const handleGoogle=async()=>{

setIsLoading(true)
setErrors({})

try {
  await loginWithGoogle()
  navigate('/home')
} catch (err) {
  console.error("Google Signup failed:", err)
  setErrors({ firebase: err.message || 'Failed to sign up with Google.' })
} finally {
  setIsLoading(false)
}

}

  return (
    <div className="min-h-screen bg-[#FCFAF5] flex justify-center items-center px-4 py-10">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-10">
        
        {/* Left Side Brand Info */}
        <div className="hidden md:flex flex-col justify-center space-y-8">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <Sprout className="w-12 h-12 text-[#E88125]" />
            <span className="text-4xl font-bold text-[#10261C]">
              BimaSetu
            </span>
          </div>

          <h1 className="text-5xl font-bold text-[#10261C] leading-tight">
            {t('auth.aiCropDamage')}
            <span className="block text-[#E88125]">
              {t('auth.assessment')}
            </span>
          </h1>

          <p className="text-gray-600 font-medium text-lg max-w-md">
            {t('auth.joinSubtitle')}
          </p>

          <div className="space-y-4 text-[#10261C] font-semibold">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#E88125]" />
              <span>{t('auth.geoVerification')}</span>
            </div>

            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#E88125]" />
              <span>{t('auth.aiCropAnalysis')}</span>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[#E88125]" />
              <span>{t('auth.pmfbyCompatible')}</span>
            </div>
          </div>
        </div>

        {/* Right Side Signup Card */}
        <div className="flex flex-col justify-center">
          <div className="bg-white border border-[#E6DCC9] shadow-xl rounded-3xl p-8 md:p-10">
            <button
              onClick={() => navigate('/')}
              className="mb-6 flex items-center gap-2 text-gray-500 hover:text-[#10261C] transition-colors duration-200 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('auth.back')}
            </button>

            <h2 className="text-3xl font-bold text-[#10261C] text-center mb-6">
              {t('auth.createAccount')}
            </h2>

            {showSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 text-green-800 text-sm font-semibold">
                {t('auth.accountCreated')}
              </div>
            )}

            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-red-800 text-sm font-medium space-y-1">
                {Object.values(errors).map((err, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 flex-shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              {/* Full Name Input */}
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('auth.fullName')}
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      fullName: e.target.value
                    });
                  }}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-[#DDD9CE] text-[#10261C] placeholder-gray-400 focus:outline-none focus:border-[#E88125] focus:ring-1 focus:ring-[#E88125] transition-all duration-300"
                />
              </div>

              {/* Email Input */}
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder={t('auth.email')}
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      email: e.target.value
                    });
                  }}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-[#DDD9CE] text-[#10261C] placeholder-gray-400 focus:outline-none focus:border-[#E88125] focus:ring-1 focus:ring-[#E88125] transition-all duration-300"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.password')}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      password: e.target.value
                    });
                  }}
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-white border border-[#DDD9CE] text-[#10261C] placeholder-gray-400 focus:outline-none focus:border-[#E88125] focus:ring-1 focus:ring-[#E88125] transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-[#10261C]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('auth.confirmPassword')}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value
                    });
                  }}
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-white border border-[#DDD9CE] text-[#10261C] placeholder-gray-400 focus:outline-none focus:border-[#E88125] focus:ring-1 focus:ring-[#E88125] transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmPassword(!showConfirmPassword);
                  }}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-[#10261C]"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#E88125] hover:bg-[#cf6f1b] text-white py-3 rounded-xl font-bold transition-all duration-300 flex justify-center items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  t('auth.creating')
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    {t('auth.createAccount')}
                  </>
                )}
              </button>

              {/* Google Signup Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleGoogle();
                }}
                className="w-full border border-[#DDD9CE] text-[#10261C] bg-white hover:bg-gray-50 py-3 rounded-xl font-semibold transition-all duration-300 flex justify-center items-center gap-2"
              >
                {t('auth.googleSignup')}
              </button>

              {/* Toggle to Login */}
              <div className="text-center text-gray-500 font-medium pt-2">
                {t('auth.hasAccount')}
                <button
                  type="button"
                  onClick={() => {
                    navigate('/login');
                  }}
                  className="text-[#E88125] font-bold ml-2 hover:underline"
                >
                  {t('nav.login')}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BimaSetuSignup;