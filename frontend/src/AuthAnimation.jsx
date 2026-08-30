import Lottie from 'lottie-react';
import loginAnimation from './animations/login.json';
import signupAnimation from './animations/signup.json';

export default function AuthAnimation({ isLogin }) {
  return (
    <Lottie
      animationData={isLogin ? loginAnimation : signupAnimation}
      loop={true}
      autoplay={true}
      className="auth-hero-lottie"
    />
  );
}
