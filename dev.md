# PEAK DEV NOTES
## OBJECTIVES
- 

## User Experience
Opening and using PEAK needs to require as little effort as possible. 

Users should be able to open the app through a shortcut without requiring any installs. 

PEAK should be easily updatable, by pulling the latest version from the Github

PEAK should be capable of operating without internet access, unless syncing with Github

## UI
The UI experience for PEAK should maximize function.

The general layout is as follows. 
- Left Rail for Navigation between Sections. Sections include
    - Search: Home view, allows user to search through all parts in any project. Navigation section on the left for filtering, details on the right for a quick peak at the selected components details
    - Create: The create window removes the navigator and details section and only consists of a single section for creating parts. The view will consist of a series on inputs where the user shall select a project from dropdown, generate a part number for that project, and fill in the required information for the part. Then hit create, this will create a part in the draft state. 
    - Projects: This creates a view with a single section that shows the projects in a folder like format. This view will also show key project details like owner and approvers.
    - Sync: This view will consists of a single section that has a pull and push button. The pull button will pull the latest version of the master branch, the push button will create a branch, create a merge request, and assign the MR to the approvers. 
    - Report: left section shows the available reports and allows selections, right main section shows report results. 
    - Settings: Single view to edit settings of the app. 
- Top Rail: Consists of a search bar, filters, and description/title of the current view. Below the title is a bit of text describing the view. 
- Main: Main body of the app. This is where all of the different views are rendered. 

## Projects
Projects can be thought of as folders

## Parts
A part is a unique object identified by its part number. Each part requires the following information. 
- Part Number: ex F-00001, where F- is a project dependent code
- Part Description: ex Fuel Pump Shaft, name of the part
- project: which project this part is assigned to.
- State: State of the part, includes Draft, Release Candidate, Released, Obsolete. 
- Revision: V1, V2, V3 for unreleased parts. A, B, C, for released revisions
- Last Edited By: Last user to update this component.
- Last Edited Date: Date of last edit
- Created By: User who created
- Created Date: Date of creation
- Google Drive Link
- Onshape Link
- Where Used: This part number is this part in the BOM of. 
- BOM data: 

Parts can be opened into their own view by double clicking them in the search view. The parts view consists of the following. 
- BOM Structure: Left Side (33% of width)
- Details: Right Side (Remaining Width)

Parts can be edited while in the parts view, and the BOM structure can be edited in this mode. This editing includes, added parts, removing parts, changing quantity. 

## Settings
The functions in settings are currently not defined. Included for future function. 
