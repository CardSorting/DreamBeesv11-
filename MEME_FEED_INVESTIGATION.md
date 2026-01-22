# Meme Feed Investigation

## Current State Analysis

### Existing Feed Patterns
The codebase has two main feed implementations that we can use as reference:

1. **MockupFeed** (`src/pages/MockupFeed.jsx`)
   - Queries `generations` collection with `type == 'mockup'` and `isPublic == true`
   - Supports filtering by creator (`userId`) and tags
   - Uses infinite scroll with Intersection Observer
   - Displays items using `FeedPost` component
   - Routes: `/mockups`, `/mockups/tag/:tag`, `/mockups/creator/:userId`

2. **ModelFeed** (`src/pages/ModelFeed.jsx`)
   - Queries `model_showcase_images` collection
   - More complex with model filtering and smart mixing
   - Uses pagination instead of infinite scroll

### Current Meme Implementation
- **Storage**: Memes are saved to `memes` collection in Firestore
- **Fields**: `userId`, `prompt`, `aspectRatio`, `modelId`, `imageUrl`, `thumbnailUrl`, `lqip`, `createdAt`, `type: 'meme'`
- **Missing**: `isPublic` field (currently not set)
- **Firestore Rules**: Only allows users to read their own memes (no public access)
- **Firestore Index**: Has index for `userId + createdAt` (for user profile queries)

## Required Changes

### 1. Add `isPublic` Field to Memes
**File**: `functions/lib/ai.js` (formatMemeWithGemini function)
- Add `isPublic: true` by default when creating memes (or make it configurable)
- Consider adding `userDisplayName` for better feed display

### 2. Update Firestore Security Rules
**File**: `firestore.rules`
- Allow public read access for memes where `isPublic == true`
- Keep owner read access for all memes
- Allow users to update `isPublic` on their own memes

### 3. Add Firestore Index
**File**: `firestore.indexes.json`
- Add composite index for querying public memes: `isPublic (ASC) + createdAt (DESC)`
- May also need: `isPublic + userId + createdAt` for creator filtering

### 4. Create MemeFeed Component
**File**: `src/pages/MemeFeed.jsx` (new file)
- Similar structure to `MockupFeed.jsx`
- Query: `memes` collection where `isPublic == true`
- Support filtering by creator (`/memes/creator/:userId`)
- Use `FeedPost` component for display
- Infinite scroll with Intersection Observer
- Deep linking support for individual memes

### 5. Add Routes
**File**: `src/components/AnimatedRoutes.jsx`
- Add route: `/memes` → `<MemeFeed />`
- Add route: `/memes/creator/:userId` → `<MemeFeed />`
- Consider: `/memes/tag/:tag` if tags are added later

### 6. Update Sidebar/Navigation
**File**: `src/components/Sidebar.jsx` (if applicable)
- Add link to meme feed in navigation

## Implementation Options

### Option A: Public by Default
- All memes are public when created
- Simpler implementation
- Users can make memes private later (if we add that feature)

### Option B: Opt-in Public
- Memes are private by default
- Users must explicitly make them public
- More privacy-focused but requires UI for toggling

### Option C: Configurable on Creation
- Add toggle in meme formatter UI
- User chooses public/private when creating
- Most flexible but requires UI changes

## Recommended Approach

**Recommendation: Option A (Public by Default)**
- Memes are inherently shareable content
- Simpler to implement initially
- Can add privacy controls later if needed
- Matches the social/community nature of memes

## Data Flow

1. User creates meme → Saved with `isPublic: true`
2. MemeFeed queries → `memes` where `isPublic == true`, ordered by `createdAt DESC`
3. Feed displays → Using `FeedPost` component (same as mockups)
4. User clicks meme → Opens in modal/lightbox (deep linking support)
5. User clicks creator → Filters feed to show only that creator's memes

## Additional Considerations

### User Display Names
- Memes currently don't store `userDisplayName`
- Options:
  1. Fetch user data on-the-fly (adds queries)
  2. Store `userDisplayName` when creating meme (simpler, but can get stale)
  3. Use a user lookup service/context

### Tags/Categories
- Currently memes don't have tags
- Could add later for filtering (e.g., "funny", "tech", "reaction")
- Would require UI in meme formatter and additional indexes

### Engagement Metrics
- Consider adding `likesCount` and `bookmarksCount` (like mockups have)
- Would require aggregation logic or Cloud Functions

### Performance
- Infinite scroll is efficient for large feeds
- Consider adding pagination limits (20-30 items per load)
- Lazy loading images (already handled by `FeedPost`)

## Files to Create/Modify

### New Files
- `src/pages/MemeFeed.jsx` - Main feed component

### Files to Modify
- `functions/lib/ai.js` - Add `isPublic` field when creating memes
- `firestore.rules` - Add public read rules for memes
- `firestore.indexes.json` - Add index for public memes query
- `src/components/AnimatedRoutes.jsx` - Add routes for meme feed
- `src/components/Sidebar.jsx` - Add navigation link (if needed)

## Testing Checklist

- [ ] Memes are created with `isPublic: true`
- [ ] Public memes are visible in feed
- [ ] Private memes (if we add that) are not visible
- [ ] Creator filtering works
- [ ] Infinite scroll loads more memes
- [ ] Deep linking to individual memes works
- [ ] FeedPost displays memes correctly
- [ ] Firestore rules prevent unauthorized access
- [ ] Indexes are deployed and working

## Future Enhancements

1. **Tags/Categories**: Add tagging system for better discovery
2. **Trending**: Show popular memes (based on likes/engagement)
3. **User Profiles**: Link to creator profiles from feed
4. **Comments**: Add commenting system (if desired)
5. **Sharing**: Social sharing buttons
6. **Privacy Controls**: Allow users to make memes private
7. **Moderation**: Admin tools for content moderation
