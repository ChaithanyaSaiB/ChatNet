# ChatNet App Usage Guide

## 1. Introduction

### Purpose:

ChatNet is an AI-powered research and exploration platform like Perplexity or ChatGPT designed for individual users with a unique conversation tree feature for easy navigation. It empowers users to control the direction of their explorations while maintaining a clear understanding of the overall process, helping them avoid long scrolling through information.

### Differentiating Factors:

**What sets ChatNet apart from existing platforms is:**

- **Visual Conversation Tree:** The conversation tree displays all your queries in the current thread and their parent queries in the Net Pane (on the right side of the screen). This allows you to quickly see the entire conversation history and jump to any point without scrolling through a long chat log.
- **User-Driven Branching:** Empowers users to direct the exploration according to their choices using a branching concept (see Section 4, Step 2).
- **Conversation Merging:** Allows users to merge different exploration branches (see Section 4, Step 2).

### Target Audience:

Individual users such as researchers who aim to visualize their search patterns and organize their thought process without switching tabs or creating new threads.

### Important Request to Users:

As this app is the result of one person's vision becoming reality and cannot be compared against the resources of large chatbot companies with teams of hundreds of people, I kindly ask that you focus on exploring the core ideas and conversation flow. Please consider any design imperfections or errors you encounter as secondary to the overall concept.

### System Requirements:

- Compatible with modern web browsers (e.g., Chrome, Firefox, Safari).
- A minimal internet connection speed is necessary for the app to function.
- The minimum necessary screen size for full functionality is a tablet screen with a keyboard. A laptop is recommended for the best experience.
- Please note that since the app is deployed on Render's free tier, it may take up to a minute to load when you first use it, as Render puts the app to sleep to conserve resources. There is a good chance the app might take close to a minute to get started, and then there is no lag while using, but it would happen for every new session. Please be patient during this initial loading time.

---

## 2. Access and Setup

### Step 1: Access the Website
Visit the ChatNet website via your preferred browser. Initial page would be login since you aren’t logged in yet.

### Step 2: Account Creation
Users must sign up if they are new. After successful signup, they will be redirected to the login page to log in.

### Step 3: Login Process
After logging in, users are redirected to the Home Page (also called "New Thread" page). When logged in, your session will last for 30 minutes. After this time, you will be required to log in again to continue using the application.

---

## 3. Key Features

### General Page Structure
Most pages within the app are structured as follows:

#### Main Menu:
- **New Net Button:** Starts a new exploration thread.
- **Home:** Returns to the home screen.
- **Library:** Lists all the user's saved conversation threads.

#### Login Bar:
- **Username:** Displays the currently logged-in user's username.
- **Logout Button:** Allows the user to log out of their account.

#### Chat Pane:
- Provides a query input field for entering your query.
- Displays the active exploration as it progresses.

#### Net Pane:
- Displays a conversation tree for dynamic navigation.

### Messaging Features
- Regular exploration flow for typing one query after another.
- Navigate back to a previous stage in the exploration by clicking nodes in the dynamically generated tree. You can then continue the conversation.
- When merging nodes, the first selected node is designated as the main parent, and the merged node is attached to that parent for organizational purposes in the tree.
- When a multiselection of nodes is done (primary node selection then Ctrl+Click on the others):
  - The first selected node is designated as the main parent.
  - Merged nodes are visually represented in the tree using a dashed line.
- In the Net Pane, the merged node's query will show its parent queries right under it.
- The merge state is temporary; after you submit a query in the merge state, the chat will revert to the history of the main parent query.

### Web Search and Sources
When the AI uses web search to answer your query, the response will include a "Sources" section listing URLs of the original sources.

### Privacy and Security
- Passwords are encrypted before storage.
- Conversations are **not encrypted**.
- Conversations are inaccessible to other users, even if someone attempts to edit the URL.

### Notifications and Alerts
There are pop-up alerts for:
- Successful signup
- Empty query submission (new thread)
- Empty query submission (continuing thread)
- Successful logout

(Currently no option to disable alerts.)

### Profile Management
- No profile management feature.
- Only username and password required at signup.

---

## 4. Using the App

### Step 1: Starting a Chat
Click the **New Net** button and enter a query.

### Step 2: Continuing Explorations
- Continue typing queries sequentially.
- Click on a node to branch off from a previous conversation state.
- Select multiple nodes (primary node selection + Ctrl+Click) to merge branches.

### Step 3: Managing Past Threads
Use the **Main Menu > Library** to access and continue past threads.

---

## 5. Future Work and Limitations

### Current Limitations
- Requires minimum tablet screen size.
- Not fully encapsulated AI-powered research platform.
- Lengthy conversations may have limitations.
- Context builder for LLM postponed.
- Redundancy not yet addressed during merge state.
- Text-only chatbot (no images, no voice inputs).

### Future Work
- Optimize merge state redundancy.
- Enhance tree visualization (highlight paths more intuitively).

---

## 6. Feedback and Improvement

Would appreciate users providing feedback to:

**chaithanyasaibommavaram@gmail.com**

If the app throws an unintended error, please take a screenshot and send it to the above email.

---

## Example Conversation Flow

### 1. Login Page
*(Initial page)*

### 2. Signup Page
*(If you aren’t signed up yet)*

### 3. Fill the form and hit "Sign Up"
- Redirected back to login page.

### 4. Login
- Use the credentials just created.

### 5. Enter a Query
- Enter a query in the center box and hit "Send".

### 6. Example Page View After Sending Query

### 7. Continue the Conversation
- Stage 1: Enter next query.
- Stage 2: See query entered while awaiting response.
- Stage 3: See AI's response and updated tree with source URLs.

### 8. Navigate Back
- Click on a previous node (e.g., root node).

### 9. Branch Off
- Give a new query after going back.

### 10. Merge Queries
- Ctrl+Click to select multiple nodes.
- Enter a new merged query.

### 11. Continue After Merging
- Submit a follow-up query from merged node.

### 12. Logout
- Click logout and confirm.

---

# Thank you.
