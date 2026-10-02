import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'

const OAuthCompletion = () => {

    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const inviteToken = searchParams.get('group_token')
    const friendInvite = searchParams.get('friend_invite')

    const joinGroup = async () => {
        try {
            const res = await api.post(`/invites/join/${inviteToken}`)
            if (res.status == 200) {
                navigate('/dashboard', {
                    state: {
                        autoJoin: true,
                        inviteToken: inviteToken,
                        group_id: res.data.group_id
                    }
                })
            }
        } catch (error: any) {
            switch (error.response?.status) {
                case 404:
                    console.error(error.response.data.detail)
                    break

                case 400:
                    navigate('/dashboard', {
                        state: {
                            autoJoin: true,
                            inviteToken: inviteToken,
                            group_id: error.response.data.detail.group_id
                        }
                    })
                    break

                default:
                    console.error(error.response?.data?.detail || "An error occurred")
                    break
            }
        }
    }

    const acceptFriendship = async ()=>{
         try{
          const res = await api.post(`friends/accept-invite/${friendInvite}`)
          if(res.status == 200){
              navigate('/dashboard')
          }
         } catch(error: any){
             console.error(error.response?.data?.detail)
         }

    }

    useEffect(() => {
        console.log(inviteToken, friendInvite)

        if (token) {
            localStorage.setItem("access_token", token)
        }

        if (inviteToken != null) {
            joinGroup()
        }

        else if(friendInvite != null && friendInvite != 'null'){
             acceptFriendship()
        }

        else {
            navigate("/dashboard")
        }
    }, [])

    return (
        <div>
        </div>
    )
}

export default OAuthCompletion
