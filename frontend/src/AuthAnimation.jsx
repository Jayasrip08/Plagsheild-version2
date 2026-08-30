import { Lottie } from 'lottie-react';
import loginAnimation from './animations/login.json';
import signupAnimation from './animations/signup.json';

export default function AuthAnimation({ isLogin }) {
  return (
    <Lottie
      src={isLogin ? loginAnimation : signupAnimation}
      loop
      autoplay
      className="auth-hero-lottie"
    />
  );
}
