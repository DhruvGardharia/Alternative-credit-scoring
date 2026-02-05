import React, { useState } from 'react'
import { UserData } from '../context/UserContext'
import { useNavigate, Link } from 'react-router-dom'
import { LoadingAnimation } from '../components/Loading'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'role1'
    })
    const [showPassword, setShowPassword] = useState(false)
    const [formError, setFormError] = useState("")
    
    const { registerUser, btnLoading } = UserData()
    const navigate = useNavigate()
    
    const handleChange = (e) => {
        const { id, value } = e.target
        setFormData(prev => ({
            ...prev,
            [id]: value
        }))
    }
    
    const submitHandler = (e) => {
        e.preventDefault()
        
        const { name, email, password, role } = formData
        
        if (!name.trim() || !email.trim() || !password.trim()) {
            setFormError("Please fill in all fields")
            return
        }
        
        if (password.length < 6) {
            setFormError("Password must be at least 6 characters long")
            return
        }
        
        if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
            setFormError("Please enter a valid email address")
            return
        }
        
        setFormError("")
        registerUser(name, email, password, role, navigate)
    }
    
    return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
            <div className='p-8 rounded-lg shadow-lg w-full max-w-md bg-white border border-gray-200'>
                <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                        </svg>
                    </div>
                    <span className='text-xl font-bold text-blue-900'>CreditFlow</span>
                </div>
                
                <h2 className='text-2xl font-bold text-blue-900 text-center mb-6'>Create Account</h2>
                
                {formError && (
                    <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm' role="alert">
                        {formError}
                    </div>
                )}
                
                <form onSubmit={submitHandler}>
                    <div className='mb-4'>
                        <label htmlFor="name" className='block text-xs font-semibold text-gray-700 mb-1'>
                            Full Name
                        </label>
                        <input 
                            value={formData.name} 
                            onChange={handleChange} 
                            required 
                            type="text" 
                            id='name' 
                            className='w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-gray-700 focus:border-blue-900 focus:outline-none text-sm' 
                            placeholder='John Doe'
                        />
                    </div>

                    <div className='mb-4'>
                        <label htmlFor="role" className='block text-xs font-semibold text-gray-700 mb-1'>
                            I am a
                        </label>
                        <select
                            id="role"
                            value={formData.role}
                            onChange={handleChange}
                            className='w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-gray-700 focus:border-blue-900 focus:outline-none text-sm'
                        >
                            <option value="role1">Gig Worker</option>
                            <option value="role2">Freelancer</option>
                            <option value="role3">Self-Employed</option>
                            <option value="role4">Other</option>
                        </select>
                    </div>
                    
                    <div className='mb-4'>
                        <label htmlFor="email" className='block text-xs font-semibold text-gray-700 mb-1'>
                            Email Address
                        </label>
                        <input 
                            value={formData.email} 
                            onChange={handleChange} 
                            required 
                            type="email" 
                            id='email' 
                            className='w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-gray-700 focus:border-blue-900 focus:outline-none text-sm' 
                            placeholder='you@example.com'
                        />
                    </div>
                    
                    <div className='mb-6'>
                        <label htmlFor="password" className='block text-xs font-semibold text-gray-700 mb-1'>
                            Password
                        </label>
                        <div className='relative'>
                            <input 
                                value={formData.password} 
                                onChange={handleChange} 
                                required 
                                type={showPassword ? "text" : "password"} 
                                id='password' 
                                className='w-full px-3 py-2 pr-10 border-2 border-blue-200 rounded-lg text-gray-700 focus:border-blue-900 focus:outline-none text-sm' 
                                placeholder='Minimum 6 characters'
                            />
                            <div 
                                className='absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer'
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? 
                                    <FaEyeSlash className='text-gray-500 hover:text-gray-700' /> : 
                                    <FaEye className='text-gray-500 hover:text-gray-700' />
                                }
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        type='submit' 
                        className='w-full py-2.5 rounded-lg shadow text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 transition flex items-center justify-center'
                        disabled={btnLoading}
                    >
                        {btnLoading ? <LoadingAnimation /> : "Create Account"}
                    </button>
                </form>
                
                <div className='mt-6 text-center'>
                    <p className='text-sm text-gray-600'>
                        Already have an account?{' '}
                        <Link to="/login" className='font-medium text-blue-900 hover:text-blue-700'>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Register 
                className='p-8 rounded-lg shadow-lg w-full max-w-md backdrop-blur-sm bg-opacity-80 bg-[#1A1A1D] border border-gray-800'
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <motion.div className='flex justify-center mb-2' variants={itemVariants}>
              
                </motion.div>
                
                <motion.h2 className='text-xl font-semibold text-center mb-2 text-[#50c878]' variants={itemVariants}>
                    PROIMG
                </motion.h2>
                
                <motion.h2 className='text-2xl font-bold text-white text-center mb-6' variants={itemVariants}>
                    Create Account
                </motion.h2>
                
                {formError && (
                    <motion.div 
                        className='mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-300 text-sm'
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        role="alert"
                    >
                        {formError}
                    </motion.div>
                )}
                
                <form onSubmit={submitHandler} noValidate>
                    <motion.div className='mb-4' variants={itemVariants}>
                        <label htmlFor="name" className='block text-sm font-medium text-gray-300 mb-1'>
                            NAME
                        </label>
                        <div className='relative'>
                            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                <FaUser className='text-gray-500' />
                            </div>
                            <input 
                                value={formData.name} 
                                onChange={handleChange} 
                                required 
                                type="text" 
                                id='name' 
                                className='w-full py-2 pl-10 pr-3 border border-gray-700 bg-gray-900 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#50c878] focus:border-transparent' 
                                placeholder='Enter your full name'
                                aria-required="true"
                            />
                        </div>
                    </motion.div>

                    <motion.div className='mb-4' variants={itemVariants}>
                        <label htmlFor="role" className='block text-sm font-medium text-gray-300 mb-1'>
                            ROLE
                        </label>
                        <select
                            id="role"
                            value={formData.role}
                            onChange={handleChange}
                            className='w-full py-2 px-3 border border-gray-700 bg-gray-900 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#50c878] focus:border-transparent'
                        >
                            <option value="role1">Role 1</option>
                            <option value="role2">Role 2</option>
                            <option value="role3">Role 3</option>
                            <option value="role4">Role 4</option>
                        </select>
                    </motion.div>
                    
                    <motion.div className='mb-4' variants={itemVariants}>
                        <label htmlFor="email" className='block text-sm font-medium text-gray-300 mb-1'>
                            EMAIL
                        </label>
                        <div className='relative'>
                            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                <FaEnvelope className='text-gray-500' />
                            </div>
                            <input 
                                value={formData.email} 
                                onChange={handleChange} 
                                required 
                                type="email" 
                                id='email' 
                                className='w-full py-2 pl-10 pr-3 border border-gray-700 bg-gray-900 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#50c878] focus:border-transparent' 
                                placeholder='Enter your email address'
                                aria-required="true"
                            />
                        </div>
                    </motion.div>
                    
                    <motion.div className='mb-4' variants={itemVariants}>
                        <label htmlFor="password" className='block text-sm font-medium text-gray-300 mb-1'>
                            PASSWORD
                        </label>
                        <div className='relative'>
                            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                <FaLock className='text-gray-500' />
                            </div>
                            <input 
                                value={formData.password} 
                                onChange={handleChange} 
                                required 
                                type={showPassword ? "text" : "password"} 
                                id='password' 
                                className='w-full py-2 pl-10 pr-10 border border-gray-700 bg-gray-900 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#50c878] focus:border-transparent' 
                                placeholder='Create a secure password'
                                aria-required="true"
                                minLength="6"
                            />
                            <button
                                type="button"
                                className='absolute inset-y-0 right-0 pr-3 flex items-center'
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? 
                                    <FaEyeSlash className='text-gray-500 hover:text-gray-300' /> : 
                                    <FaEye className='text-gray-500 hover:text-gray-300' />
                                }
                            </button>
                        </div>
                        
                        {formData.password && (
                            <div className="mt-2">
                                <div className="flex space-x-1 mb-1">
                                    {[0, 1, 2, 3].map((index) => (
                                        <div 
                                            key={index} 
                                            className={`h-1 flex-1 rounded-full ${
                                                passwordStrength > index 
                                                    ? strengthColors[passwordStrength] 
                                                    : 'bg-gray-700'
                                            }`}
                                        ></div>
                                    ))}
                                </div>
                                <p className='text-xs text-gray-400'>
                                    {passwordStrength === 0 && "Very weak - add uppercase, numbers, and symbols"}
                                    {passwordStrength === 1 && "Weak - add more variety to your password"}
                                    {passwordStrength === 2 && "Medium - getting better!"}
                                    {passwordStrength === 3 && "Good - your password is strong"}
                                    {passwordStrength === 4 && "Excellent - your password is very strong"}
                                </p>
                            </div>
                        )}
                        
                        <p className='mt-1 text-xs text-gray-400'>Password must be at least 6 characters long</p>
                    </motion.div>
                    
                    <motion.button 
                        type='submit' 
                        className='w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#50c878] hover:bg-[#3daf63] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#50c878] transition-colors duration-200 flex items-center justify-center'
                        disabled={btnLoading}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {btnLoading ? <LoadingAnimation /> : "CREATE ACCOUNT"}
                    </motion.button>
                    
                    <motion.div className='mt-6 text-center' variants={itemVariants}>
                        <div className='relative mb-4'>
                            <div className='absolute inset-0 flex items-center'>
                                <div className='w-full border-t border-gray-700'></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className='px-2 bg-[#1A1A1D] text-gray-400'>or</span>
                            </div>
                        </div>
                        
                        
                        
                        <div className='text-gray-300'>
                            Already have an account?{' '}
                            <Link to="/login" className='font-medium text-[#50c878] hover:underline'>
                                Sign in instead
                            </Link>
                        </div>
                    </motion.div>
                </form>
            </motion.div>
        </div>
    )
}

export default Register