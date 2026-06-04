## Background

In this request you will generate maintenance UI for videos in the video table. 
- As defined in the "src/app/(support)/(logged-in)/(videos)/add-videos/page.tsx" file, only admin members can access this page. This logic is already present in the file.
- The s3 path is family-social-support-bucket/app-help-videos
- There are four video tables defined in "src/components/db/schema/family-social-schema-tables.ts" file and they begin with the literal "video"
- The "src/lib" folder contains various existing s3-related components that can be used as a pattern for accessing the new bucket on s3.

## Request

- The AddVideoForm must show a list of video table entries. 
- Initially the table will be empty so an add video form is needed.
- The videoTagReference and videoTag tables are used to associated 3 tag selections.
- A video mp4 file will be selected in this add dialog and uploaded to S3 when submitted.
- There should be a progress indicator on the upload and the files are expected to be 14-20MB in size.
- The videoS3Credentials able contains the necessary S3 information for the bucket name, the s3 access key and secret and the region.
- The aws cli interface was used to confirm the IAM user access to the support bucket on s3.
