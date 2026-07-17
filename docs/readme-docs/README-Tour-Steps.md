# Overview
There will be the ability for a member to update his settings to allow guided tours. All tours will be short, so as not to try a member's patience.

- By default a new member will have a new member orientation.
- If they want the best way to enter a certain post, then there will be a tour of the feature to highlight key aspects of the feature

# New Member Tour
There are actually two different member tours, one for the family founder and one for new members (not the founder)

## guidedTourReference Global Table

- id: `1`
- tourKey: `new_member`
- tourName: `Getting Started`
- featureName: `member_account`
- status: `published`
- audienceType: `all`

## guidedTourStepReference Global Table
- id: `1`
- stepKey: `member_welcome`
- stepNo: `1`
- routePattern: `continuous`
- targetSelector: `welcome-card`
- snippetTitle: `Welcome!`
- snippetBody: `Take this short tour, it will save you time later.`
- placement: `centered`
- tourId: `1`

- id: `2`
- stepKey: `member_start`
- stepNo: `2`
- routePattern: `continuous`
- targetSelector: `#main-profile-icon`
- snippetTitle: `Member Profile Settings`
- snippetBody: `First things first, let's review and update your member profile.`
- placement: `left`
- tourId: `1`

- id: `3`
- stepKey: `upload_your_mugshot`
- stepNo: `3`
- routePattern: `continuous`
- targetSelector: `#upload-link`
- snippetTitle: `Upload your Mug`
- snippetBody: `Let your family and friends see what you look like as you post things for the family to see.`
- placement: `bottom`
- tourId: `1`

- id: `4`
- stepKey: `update_your_info`
- stepNo: `4`
- routePattern: `continuous`
- targetSelector: `profile-tab`
- snippetTitle: `Update Member Info`
- snippetBody: `Most information is optional but good to have, like your birthday and if you have a nick name you prefer.`
- placement: `top`
- tourId: `1`

- id: `5`
- stepKey: `member_settings`
- stepNo: `5`
- routePattern: `continuous`
- targetSelector: `settings-tab`
- snippetTitle: `Member Settings`
- snippetBody: `Set what features you would like to be notified on when other members post in your family.`
- placement: `top`
- tourId: `1`


# Tour Reference UI
The purpose of this request is to generate a UI an admin can use to define the metadata associated with joyrides. Once the UI exists then I'll focus a separate request on implementing the first joyride. 

- There are two tables in the global_schema that represent the joyride metadata (listed below) that will be used to drive the joyride steps implemented in the family_schema. 
  - guided_tour_reference
  - guided_tour_step_reference

- I have already seeded data some of the data into the tables.
- The UI is only accessible by an admin and should be included as an option in the Profile dropdown menu
- The app route home page is defined in "src/app/(support)/(logged-in)/(guided)/add-guided"
- This page reference a component in "src/features/support/components/add-guided-form.tsx"
- The format of the home page should be to provide a list of guidedTourReference. With that list should be an option to add another guidedTourReference. 
- If a guidedTourReference is selected then there should be options to Add, Edit, or Delete a guidedTourStepReference. 
- When entering the step reference details there should be various selection lists for some of the properties:
  - status: "published" (default) or "draft"
  - audienceType: "all", "founder", "member" (default), "support" 
  - routePattern: "uncontrolled", "controlled" (default), "hooks"
  - placement: "top", "left", "bottom" (default), "right", "centered"

Listed below are sample entries that were added to the the guided tour reference tables. 

## guidedTourReference Global Table

- id: `1`
- tourKey: `new_member`
- tourName: `Getting Started`
- featureName: `member_account`
- status: `published`
- audienceType: `all`

- id: `2`
- stepKey: `member_start`
- stepNo: `2`
- routePattern: `controlled`
- targetSelector: `#main-profile-icon`
- snippetTitle: `Member Profile Settings`
- snippetBody: `First things first, let's review and update your member profile.`
- placement: `left`
- tourId: `1`

- id: `3`
- stepKey: `upload_your_mugshot`
- stepNo: `3`
- routePattern: `controlled`
- targetSelector: `#upload-avatar-link`
- snippetTitle: `Upload Your Best Mug Shot`
- snippetBody: `As you add posts, create comments for your family to see, they should also see your good-looking mug. It's quick and easy to do. Try it!`
- placement: `bottom`
- tourId: `1`

# Initial Implementation
The basic guided tour setup is configured and the task now is to initiate the new_member tour, if it hasn't completed. Here are the conditions for launching it.

1. A **non-founder member** logs in and is directed to the main application page.
2. If the member_option table referencing the member_option_reference.option_name of `Tour Guide` 
    and the member has this option set to `true` then the next available guide_member_step_progress should be followed. If the member_option table is set to false then there is no tour.
3. The global_schema.guidedTourReference.audiencyType of `member` references the appropriate tour to be followed.
4. If there are no records in the family_schema then:
   a. An insert into the `family_schema.guidedMemberTourProgress` table for that member/family and guided_tour_reference.tour_key value of `new_member`.
   b. This initial insert would then be followed by  insert one guided_member_tour_progress row, then insert missing guided_member_tour_step_progress rows for that progress id, based on the records in `global_schema.guided_tour_step_reference`. 
   c. If there are records in the member progress table already and there are uncompleted steps then resume the tour from that point.
   d. If there are records in the member progress and all member steps are completed then this joyride is done.
   e. Steps c-d above must be done in the same unit of work for transaction safety.

Here is a summary of the above flow.
1. On main page load for logged-in member: Check Tour Guide option and role/audience eligibility.
2. Resolve tour by key: Find published new_member tour for current version and audience.
3. Ensure progress exists: Upsert guided_member_tour_progress for member/family/tour/version.
4. Ensure step-progress rows exist: Insert only missing rows from global guided_tour_step_reference.
5. Resume logic: Pick first step where status is not completed/skipped/dismissed (per your policy), ordered by stepNo.
6. Completion logic: If none remain, mark tour done and do not launch Joyride.
7. Launch Joyride in controlled mode: Feed it exactly the remaining steps and current index from DB.

As I envision there are going to be 7-8 different tours, there should be a reusable component that can be `plugged` into each of features where a joyride is needed.

Reusable architecture for 7-8 tours

1. Tour resolver service: Given member context + route, return active tour + resumable steps.
2. Progress command service: Start, next, skip, complete, dismiss APIs.
3. Generic joyride runner component: Accepts normalized steps and callbacks; no feature-specific DB logic inside.
4. Feature adapters: Small per-feature mapping layer for selector/route assumptions only
