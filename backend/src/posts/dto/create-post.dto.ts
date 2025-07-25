export class CreatePostDto {
    /** Short headline for the post */
    title?: string
  
    /** Body / caption text */
    body: string
  
    /** Optional link to an image */
    imageUrl?: string
  }