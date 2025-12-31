/* eslint-disable no-console */
import { getPayload } from 'payload';

import configPromise from '@payload-config';

/**
 * Fetches posts for an archive view with pagination.
 * @param page - The page number to fetch (default: 1).
 * @param limit - The number of posts per page (default: 10).
 * @returns A promise that resolves to an object containing paginated post data,
 * or null if an error occurs.
 */
export const getPostsForArchive = async (
  page: number = 1,
  limit: number = 10,
) => {
  try {
    const payload = await getPayload({
      config: configPromise,
    });
    const posts = await payload.find({
      collection: 'posts',
      where: {
        _status: {
          equals: 'published',
        },
      },
      sort: '-publishedDate',
      limit,
      page,
    });

    return posts;
  } catch (error) {
    console.error('Error fetching posts for archive:', error);
    return null;
  }
};

/**
 * Fetches a single post by its ID from the 'posts' collection.
 * @param id - The ID of the post to fetch.
 * @returns A promise that resolves to the fetched post or null if not found.
 */
export const getPostById = async (id: string) => {
  try {
    const payload = await getPayload({
      config: configPromise,
    });
    const post = await payload.find({
      collection: 'posts',
      where: {
        id: {
          equals: id,
        },
        _status: {
          equals: 'published',
        },
      },
    });

    if (post.docs.length > 0) {
      return post.docs.at(0);
    }
    return null;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
};
