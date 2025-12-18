testing_notes.txt
=================

1) Chatbot API tests (travel app)

- File: travel/tests/test_chatbot.py
- Uses APITestCase and API client.
- setUp: creates Area, Service ("Test Hospital"), Place ("Test Place").
- Tests greeting, "hospitals near Dhanmondi", and "places near Dhanmondi" responses and listed objects.

2) Chat API tests (chat app)

- File: chat/tests/test_chat_api.py
- Uses APITestCase and API client.
- setUp: two users (u1, u2), one ACTIVE ChatThread with both participants, one ChatMessage "hello".
- Uses X-User-Token header.
- Tests listing threads, creating/reusing thread, self-chat forbidden, accepting pending thread, listing and creating messages.

3) Community API tests (community app)

- File: community/tests/test_community_api.py
- Uses APITestCase and API client.
- setUp: Area, traveler user/account, admin user/account + AdminProfile with area, one CommunityPost.
- Uses X-User-Token and X-User-Mode headers.
- Tests:
  - Traveler can create post (201, correct area/category).
  - Non-traveler (ADMIN) forbidden to create post (403).
  - Admin area posts returns only posts from admin’s area.
  - Admin can delete post/comment in own area (204, removed from DB).
