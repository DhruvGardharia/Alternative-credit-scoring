import React, { useState } from 'react'
import { UserData } from '../context/UserContext'
import { useNavigate, Link } from 'react-router-dom'
import { LoadingAnimation } from '../components/Loading'

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
        <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 py-12 px-4'>
            <div className='p-5 rounded-2xl shadow-2xl w-full max-w-sm bg-white'>
                <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                        </svg>
                    </div>
                    <span className='text-lg font-bold text-gray-800'>CreditFlow</span>
                </div>
                
                <h2 className='text-lg font-bold text-gray-900 text-center mb-1'>Create Account</h2>
                <p className='text-xs text-gray-600 text-center mb-4'>Sign up free</p>
                
                {formError && (
                    <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm' role="alert">
                        {formError}
                    </div>
                )}
                
                <form onSubmit={submitHandler}>
                    <div className='mb-2.5'>
                        <label htmlFor="name" className='block text-xs font-semibold text-gray-700 mb-1'>
                            Full Name
                        </label>
                        <input 
                            value={formData.name} 
                            onChange={handleChange} 
                            required 
                            type="text" 
                            id='name' 
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 focus:outline-none text-sm' 
                            placeholder='John Doe'
                        />
                    </div>

                    <div className='mb-2.5'>
                        <label htmlFor="role" className='block text-xs font-semibold text-gray-700 mb-1'>
                            I am a
                        </label>
                        <select
                            id="role"
                            value={formData.role}
                            onChange={handleChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 focus:outline-none text-sm'
                        >
                            <option value="role1">Gig Worker</option>
                            <option value="role2">Freelancer</option>
                            <option value="role3">Self-Employed</option>
                            <option value="role4">Other</option>
                        </select>
                    </div>
                    
                    <div className='mb-2.5'>
                        <label htmlFor="email" className='block text-xs font-semibold text-gray-700 mb-1'>
                            Email Address
                        </label>
                        <input 
                            value={formData.email} 
                            onChange={handleChange} 
                            required 
                            type="email" 
                            id='email' 
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 focus:outline-none text-sm' 
                            placeholder='you@example.com'
                        />
                    </div>
                    
                    <div className='mb-3.5'>
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
                                className='w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-gray-700 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 focus:outline-none text-sm' 
                                placeholder='Minimum 6 characters'
                            />
                            <button
                                type="button"
                                className='absolute inset-y-0 right-0 pr-3 flex items-center'
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <svg className='w-5 h-5 text-gray-500 hover:text-gray-700' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className='w-5 h-5 text-gray-500 hover:text-gray-700' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    <button 
                        type='submit' 
                        className='w-full py-2.5 rounded-lg shadow-md text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition transform hover:-translate-y-0.5 flex items-center justify-center'
                        disabled={btnLoading}
                    >
                        {btnLoading ? <LoadingAnimation /> : "Create Account"}
                    </button>
                </form>
                
                <div className='mt-4 text-center'>
                    <p className='text-xs text-gray-600'>
                        Already have an account?{' '}
                        <Link to="/login" className='font-semibold text-purple-700 hover:text-purple-900'>
                            Sign in
                        </Link>
                    </p>
                </div>
                
                <div className='mt-3 pt-3 border-t border-gray-200 text-center'>
                    <Link to="/" className='text-xs text-gray-500 hover:text-purple-700 flex items-center justify-center gap-1'>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Register