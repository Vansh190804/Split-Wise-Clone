from jinja2 import Environment, FileSystemLoader

env = Environment(
    loader=FileSystemLoader("emails/templates")
)

print("Email templates loaded successfully.")

def render_html_existingUser(sender_name: str, invite_link: str):

    template = env.get_template("invitation_notice.html")

    return template.render(
        sender_name=sender_name,
        invite_link=invite_link
    )

def render_html_newUser(sender_name: str, invite_link: str):

    template = env.get_template("invitation_new_user.html")

    return template.render(
        sender_name=sender_name,
        invite_link=invite_link
    )

def render_html_inviteToGroup(sender_name: str, group_name: str, invite_link: str):

    template = env.get_template("invite_to_group.html")

    return template.render(
        sender_name=sender_name,
        group_name=group_name,
        invite_link=invite_link
    )
