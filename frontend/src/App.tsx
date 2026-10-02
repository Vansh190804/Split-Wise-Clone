import { BrowserRouter, Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import InvitePage from './pages/InvitePage'
import OuthCompletion from './pages/OAuthCompletion'
import FriendInvite from './pages/friend-invite'
import Profile from './pages/Profile'

function App() {
  

  return (
    <>
      <BrowserRouter>
        <Routes>
            <Route path='/' element = {<Home/>} />
            <Route path='/login' element = {<Login/>} />
            <Route path='/register' element = {<Register/>} />
            <Route path='/dashboard' element = {<Dashboard/>} />
            <Route path='/profile' element = {<Profile/>}/>
            <Route path = '/OAuthCompletion' element = {<OuthCompletion/>}/>
            <Route path = '/friend-invite/:token' element = {<FriendInvite/>}/>
            <Route path = '/group-invite/:token' element = {<InvitePage/>}/>
        </Routes>
       </BrowserRouter>
    </>
  )
}

export default App
