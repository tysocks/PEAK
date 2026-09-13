UI Improvements

# First Pass
## General Improvements
1. Remove Top Ribbon with file, edit, view menu

## Overall Layout
Lets change the layout to share a similar layout as the notion app. This includes the following features. 
1. Sidebar on the Left that shows all the options and file hierachies.
2. Large workspace on the right that shows the selected tabs, this space supports multiple tabs including horizontal split screen. 
3. At the top of the right side, include the tab selection ribbon, highlight the active tab. 
4. Left to the tab ribbon, include a sidebar toggle button to show and hide the sidebar. 


## Multiple Tabs
The current implementation can only support single tabs which makes it challenging to look at multiple parts at once. Refactor the app to support an arbitary number of tabs and allows the users to switch freely between the 2. 

Additional function can be to have split screen.

## Sidebar
The new sidebar is going to completely refresh how the application is interacted with. 

1. Like notion, include a home, create, inbox, and search button at the top of the sidebar. 
2. Split the sidebar into sections similar to notion. Include a favorite section on top where users can pin their parts. Below that, include all of the projects as folders such as teamspaces on notion. The goal is the show all the components in the project summarized on the left in the structure tree. Start with all project collapsed and allow the user to expand the tree. At the bottom, move the projects, history, table, and report button similar to the Library and My Tasks buttons on the Notion sidebar. 
3. Make it so when projects, history, table, or report is clicked this opens a new tab on the right instead of completely replacing the right section with new content. Everything displayed on the right should be in a tab. 
4. The buttons at the top of the sidebar being home, create, inbox, and search should change what is displayed on the sidebar or open a popup to interact with. Home should bring the sidebar back to the default view with favorites and project trees. Inbox will change the sidebar to a list of actions assigned to the user. Create will open a popup to prompt for a new part. Search will open a popup similar to the Notion search button which has a search bar, filter, scrolling list on the left and preview on the right.

# Second Pass
## Part View
The part view needs a solid overhaul. It is just too clunky to use. 

First change, remove the multiple sections (Overview, Attachments, Relation, and Workflow). Also remove the right ribbon. 

Let reimagine the part page from the ground up. 

The first change, split the page in to pieces, the left is the BOM Structure, and Details on the right. Do not include labels on either side. 

At the top right of the details section, add a side panel button, star button, and option button. 

Side Panel toggles a right side panel that shows the details of the part such as Created By, Created Date, Last Edited By, Last Edited Time. Use the same format as the view details button in Notion

Star Button, Favorites the part and adds it to the favorite list

Option Button. Opens a right panel with a list of options such as Open Google Drive, Open CAD, Open WI, Edit Part, Edit Attachments, Copy Part ID.

On the details side of the window, combine the information from the 4 sections into a single page. 