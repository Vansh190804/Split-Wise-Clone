import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import { useEffect, useRef } from 'react'


const FriendInvite = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const hasAttemted = useRef(false) 

  const verify_token = async () => {
      try{
          const res = await api.post(`/friends/valid-invite/${token}`)
          if(res.status == 200){
              handleAcceptFriendship()
          }
      } catch(error: any){
             console.error(error.response?.data?.detail)
             alert(error.response?.data?.detail)
             
             const response = await api.get(`/auth/me`)
             if(response.status == 200){
                 navigate('/dashboard')
             }
             else{
                 navigate('/register')
             }
      }
  }

  const handleAcceptFriendship = async () => {
      try{
        const res = await  api.post(`/friends/accept-invite/${token}`)
        if(res.status == 200){
            navigate('/dashboard')
        }
      } catch(error: any){
         switch (error.response?.status){
              case 404:
                  console.error(error.response.data.detail)
                  alert(error.response.data.detail)
                  navigate('/register')
                  break
              
              case 401:
                 navigate(`/register?friend_invite=${token}`)
                 break
                
              case 400:
                  console.error(error.response.data.detail)
                  // alert(error.response.data.detail)
                  navigate('/dashboard')
                  break
         }
      }
        
  }

  console.log("FriendInvite rendered");

  useEffect(() => {
    if(hasAttemted.current) return;

    hasAttemted.current = true;
    verify_token()

    return () => console.log("cleanup");
  }, [])
  

  return (
    <div>
        
    </div>
  )
}

export default FriendInvite
