import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { GHLApiClient } from '../clients/ghl-api-client.js';
import {
  MCPSearchPostsParams,
  MCPCreatePostParams,
  MCPGetPostParams,
  MCPUpdatePostParams,
  MCPDeletePostParams,
  MCPBulkDeletePostsParams,
  MCPGetAccountsParams,
  MCPDeleteAccountParams,
  MCPUploadCSVParams,
  MCPGetUploadStatusParams,
  MCPSetAccountsParams,
  MCPGetCategoriesParams,
  MCPGetCategoryParams,
  MCPGetTagsParams,
  MCPGetTagsByIdsParams,
  MCPStartOAuthParams,
  MCPGetOAuthAccountsParams
} from '../types/ghl-types.js';

export class SocialMediaTools {
  // CRITICAL FIX: Account ID to User ID mapping for all platforms
  private readonly ACCOUNT_USER_MAP: Record<string, string> = {
    // Instagram
    "6899a0d79ba76f81dfd5a8a7_Q8AartZra4zq0KLYE3pv_17841460047932407": "6899a0e56f817ea9d82ac642",
    // Facebook
    "6899a077ce858b5967303c94_Q8AartZra4zq0KLYE3pv_538741682661219_page": "6899a080505038c34ea6b2b6",
    // LinkedIn Page
    "6899a10e6f817e668f2ae421_Q8AartZra4zq0KLYE3pv_106422908_page": "6899a1156f817eed5a2ae9d7",
    // LinkedIn Personal
    "6899a10e6f817e668f2ae421_Q8AartZra4zq0KLYE3pv_nyjwM8xMvp_profile": "689eb23a233e68d9364d174d",
    // Threads
    "690aeaaa4d3e86b4fe97ab08_Q8AartZra4zq0KLYE3pv_24940792358923719_profile": "690aeba3770707192d9fc3bd",
    // TikTok
    "689eb3d255bbfc903ed4ce40_Q8AartZra4zq0KLYE3pv_000qG6qCjMKBvRrYwwJou1mEbJs7OQ4L5_business": "689eb3f2233e6891ad4df449",
    // YouTube
    "68bce57e74e7453c79525725_Q8AartZra4zq0KLYE3pv_UCW1N70eRtFPNbejfxUqYt4Q_profile": "68bce5899a395c0f326d2e2a",
    // Google Business
    "6899a14750503879dea74345_Q8AartZra4zq0KLYE3pv_9102480444095491921": "689eb20c233e686a9f4cff97",
    // Bluesky
    "68f8711d98629155ff1c8665_Q8AartZra4zq0KLYE3pv_did:plc:lqkqumsx6ddxwe5m5rrjyhkn_profile": "68f8712b141c8df90a2cb621"
  };

  constructor(private ghlClient: GHLApiClient) {}

  getTools(): Tool[] {
    return [
      // Post Management Tools
      {
        name: 'search_social_posts',
        description: 'Search and filter social media posts across all platforms',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['recent', 'all', 'scheduled', 'draft', 'failed', 'in_review', 'published', 'in_progress', 'deleted'],
              description: 'Filter posts by status',
              default: 'all'
            },
            accounts: {
              type: 'string',
              description: 'Comma-separated account IDs to filter by'
            },
            skip: { type: 'number', description: 'Number of posts to skip', default: 0 },
            limit: { type: 'number', description: 'Number of posts to return', default: 10 },
            fromDate: { type: 'string', description: 'Start date (ISO format)' },
            toDate: { type: 'string', description: 'End date (ISO format)' },
            includeUsers: { type: 'boolean', description: 'Include user data in response', default: true },
            postType: {
              type: 'string',
              enum: ['post', 'story', 'reel'],
              description: 'Type of post to search for'
            }
          },
          required: ['fromDate', 'toDate']
        }
      },
      {
        name: 'create_social_post',
        description: 'Create a new social media post for multiple platforms. Supports Instagram carousels with multiple images.',
        inputSchema: {
          type: 'object',
          properties: {
            accountIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of social media account IDs to post to'
            },
            summary: { type: 'string', description: 'Post content/text' },
            media: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string', description: 'Media URL' },
                  caption: { type: 'string', description: 'Media caption' },
                  type: { type: 'string', description: 'Media MIME type' }
                },
                required: ['url']
              },
              description: 'Media attachments (for Instagram carousel: provide multiple image URLs)'
            },
            status: {
              type: 'string',
              enum: ['draft', 'scheduled', 'published'],
              description: 'Post status',
              default: 'draft'
            },
            scheduleDate: { type: 'string', description: 'Schedule date for post (ISO format)' },
            followUpComment: { type: 'string', description: 'Follow-up comment' },
            type: {
              type: 'string',
              enum: ['post', 'story', 'reel'],
              description: 'Type of post'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tag IDs to associate with post'
            },
            categoryId: { type: 'string', description: 'Category ID' },
            userId: { type: 'string', description: 'User ID creating the post (optional - will be auto-detected from accountId)' },
            platformDetails: {
              type: 'object',
              description: 'Platform-specific posting parameters (REQUIRED for Instagram carousel)',
              properties: {
                instagram: {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['feed', 'story', 'reel'],
                      description: 'Instagram post type - use "feed" for carousel posts'
                    }
                  }
                },
                facebook: {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['post', 'video', 'photo'],
                      description: 'Facebook post type'
                    }
                  }
                },
                linkedin: {
                  type: 'object',
                  properties: {
                    title: {
                      type: 'string',
                      description: 'LinkedIn post title'
                    },
                    link: {
                      type: 'string',
                      description: 'LinkedIn link URL'
                    }
                  }
                }
              }
            }
          },
          required: ['accountIds', 'summary', 'type']
        }
      },
      {
        name: 'get_social_post',
        description: 'Get details of a specific social media post',
        inputSchema: {
          type: 'object',
          properties: {
            postId: { type: 'string', description: 'Social media post ID' }
          },
          required: ['postId']
        }
      },
      {
        name: 'update_social_post',
        description: 'Update an existing social media post',
        inputSchema: {
          type: 'object',
          properties: {
            postId: { type: 'string', description: 'Social media post ID' },
            summary: { type: 'string', description: 'Updated post content' },
            status: {
              type: 'string',
              enum: ['draft', 'scheduled', 'published'],
              description: 'Updated post status'
            },
            scheduleDate: { type: 'string', description: 'Updated schedule date' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Updated tag IDs'
            }
          },
          required: ['postId']
        }
      },
      {
        name: 'delete_social_post',
        description: 'Delete a social media post',
        inputSchema: {
          type: 'object',
          properties: {
            postId: { type: 'string', description: 'Social media post ID to delete' }
          },
          required: ['postId']
        }
      },
      {
        name: 'bulk_delete_social_posts',
        description: 'Delete multiple social media posts at once (max 50)',
        inputSchema: {
          type: 'object',
          properties: {
            postIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of post IDs to delete',
              maxItems: 50
            }
          },
          required: ['postIds']
        }
      },
      // Account Management Tools
      {
        name: 'get_social_accounts',
        description: 'Get all connected social media accounts and groups',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'delete_social_account',
        description: 'Delete a social media account connection',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: { type: 'string', description: 'Account ID to delete' },
            companyId: { type: 'string', description: 'Company ID' },
            userId: { type: 'string', description: 'User ID' }
          },
          required: ['accountId']
        }
      },
      // CSV Operations Tools
      {
        name: 'upload_social_csv',
        description: 'Upload CSV file for bulk social media posts',
        inputSchema: {
          type: 'object',
          properties: {
            file: { type: 'string', description: 'CSV file data (base64 or file path)' }
          },
          required: ['file']
        }
      },
      {
        name: 'get_csv_upload_status',
        description: 'Get status of CSV uploads',
        inputSchema: {
          type: 'object',
          properties: {
            skip: { type: 'number', description: 'Number to skip', default: 0 },
            limit: { type: 'number', description: 'Number to return', default: 10 },
            includeUsers: { type: 'boolean', description: 'Include user data' },
            userId: { type: 'string', description: 'Filter by user ID' }
          }
        }
      },
      {
        name: 'set_csv_accounts',
        description: 'Set accounts for CSV import processing',
        inputSchema: {
          type: 'object',
          properties: {
            accountIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Account IDs for CSV import'
            },
            filePath: { type: 'string', description: 'CSV file path' },
            rowsCount: { type: 'number', description: 'Number of rows to process' },
            fileName: { type: 'string', description: 'CSV file name' },
            approver: { type: 'string', description: 'Approver user ID' },
            userId: { type: 'string', description: 'User ID' }
          },
          required: ['accountIds', 'filePath', 'rowsCount', 'fileName']
        }
      },
      // Categories & Tags Tools
      {
        name: 'get_social_categories',
        description: 'Get social media post categories',
        inputSchema: {
          type: 'object',
          properties: {
            searchText: { type: 'string', description: 'Search for categories' },
            limit: { type: 'number', description: 'Number to return', default: 10 },
            skip: { type: 'number', description: 'Number to skip', default: 0 }
          }
        }
      },
      {
        name: 'get_social_category',
        description: 'Get a specific social media category by ID',
        inputSchema: {
          type: 'object',
          properties: {
            categoryId: { type: 'string', description: 'Category ID' }
          },
          required: ['categoryId']
        }
      },
      {
        name: 'get_social_tags',
        description: 'Get social media post tags',
        inputSchema: {
          type: 'object',
          properties: {
            searchText: { type: 'string', description: 'Search for tags' },
            limit: { type: 'number', description: 'Number to return', default: 10 },
            skip: { type: 'number', description: 'Number to skip', default: 0 }
          }
        }
      },
      {
        name: 'get_social_tags_by_ids',
        description: 'Get specific social media tags by their IDs',
        inputSchema: {
          type: 'object',
          properties: {
            tagIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of tag IDs'
            }
          },
          required: ['tagIds']
        }
      },
      // OAuth Integration Tools
      {
        name: 'start_social_oauth',
        description: 'Start OAuth process for social media platform',
        inputSchema: {
          type: 'object',
          properties: {
            platform: {
              type: 'string',
              enum: ['google', 'facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'tiktok-business'],
              description: 'Social media platform'
            },
            userId: { type: 'string', description: 'User ID initiating OAuth' },
            page: { type: 'string', description: 'Page context' },
            reconnect: { type: 'boolean', description: 'Whether this is a reconnection' }
          },
          required: ['platform', 'userId']
        }
      },
      {
        name: 'get_platform_accounts',
        description: 'Get available accounts for a specific platform after OAuth',
        inputSchema: {
          type: 'object',
          properties: {
            platform: {
              type: 'string',
              enum: ['google', 'facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'tiktok-business'],
              description: 'Social media platform'
            },
            accountId: { type: 'string', description: 'OAuth account ID' }
          },
          required: ['platform', 'accountId']
        }
      }
    ];
  }

  async executeTool(name: string, args: any): Promise<any> {
    try {
      switch (name) {
        case 'search_social_posts':
          return await this.searchSocialPosts(args);
        case 'create_social_post':
          return await this.createSocialPost(args);
        case 'get_social_post':
          return await this.getSocialPost(args);
        case 'update_social_post':
          return await this.updateSocialPost(args);
        case 'delete_social_post':
          return await this.deleteSocialPost(args);
        case 'bulk_delete_social_posts':
          return await this.bulkDeleteSocialPosts(args);
        case 'get_social_accounts':
          return await this.getSocialAccounts(args);
        case 'delete_social_account':
          return await this.deleteSocialAccount(args);
          
        // --- ADDED MISSING CSV HANDLERS ---
        case 'upload_social_csv':
          return await this.uploadCsv(args);
        case 'get_csv_upload_status':
          return await this.getCsvUploadStatus(args);
        case 'set_csv_accounts':
          return await this.setCsvAccounts(args);
        // ----------------------------------

        case 'get_social_categories':
          return await this.getSocialCategories(args);
        case 'get_social_category':
          return await this.getSocialCategory(args);
        case 'get_social_tags':
          return await this.getSocialTags(args);
        case 'get_social_tags_by_ids':
          return await this.getSocialTagsByIds(args);
        case 'start_social_oauth':
          return await this.startSocialOAuth(args);
        case 'get_platform_accounts':
          return await this.getPlatformAccounts(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      throw new Error(`Error executing ${name}: ${error}`);
    }
  }

  // Implementation methods
  private async searchSocialPosts(params: MCPSearchPostsParams) {
    const response = await this.ghlClient.searchSocialPosts({
      type: params.type,
      accounts: params.accounts,
      skip: params.skip?.toString(),
      limit: params.limit?.toString(),
      fromDate: params.fromDate,
      toDate: params.toDate,
      includeUsers: params.includeUsers?.toString() || 'true',
      postType: params.postType
    });

    return {
      success: true,
      posts: response.data?.posts || [],
      count: response.data?.count || 0,
      message: `Found ${response.data?.count || 0} social media posts`
    };
  }

  private async createSocialPost(params: MCPCreatePostParams) {
    // Validate accountIds
    if (!params.accountIds || params.accountIds.length === 0) {
      throw new Error('accountIds is required and must contain at least one account ID');
    }

    // CRITICAL FIX: Get userId from params or map it from the first accountId
    let userId = params.userId;
    
    if (!userId) {
      userId = this.ACCOUNT_USER_MAP[params.accountIds[0]];
      
      if (!userId) {
        throw new Error(
          `Unknown account ID: ${params.accountIds[0]}. Cannot determine userId. ` +
          `Available account IDs: ${Object.keys(this.ACCOUNT_USER_MAP).join(', ')}`
        );
      }
    }

    // Ensure type is provided (required by GHL API)
    const postType = params.type || 'post';

    try {
      const response = await this.ghlClient.createSocialPost({
        accountIds: params.accountIds,
        summary: params.summary,
        media: params.media || [],
        status: params.status,
        scheduleDate: params.scheduleDate,
        followUpComment: params.followUpComment,
        type: postType,
        tags: params.tags,
        categoryId: params.categoryId,
        userId: userId,  // CRITICAL: This was missing before!
        platformDetails: params.platformDetails
      });

      return {
        success: true,
        post: response.data?.post,
        accountIds: params.accountIds,
        userId: userId,
        mediaCount: params.media?.length || 0,
        message: `Social media post created successfully for ${params.accountIds.length} account(s)`
      };
    } catch (error: any) {
      // Enhanced error handling
      if (error.response?.status === 400) {
        return {
          success: false,
          error: `Bad Request: ${error.response?.data?.message || 'Invalid post parameters'}`,
          details: {
            statusCode: 400,
            accountIds: params.accountIds,
            userId: userId,
            hasMedia: !!params.media && params.media.length > 0,
            mediaCount: params.media?.length || 0,
            type: postType,
            apiResponse: error.response?.data
          }
        };
      }
      
      throw error;
    }
  }

  private async getSocialPost(params: MCPGetPostParams) {
    const response = await this.ghlClient.getSocialPost(params.postId);

    return {
      success: true,
      post: response.data?.post,
      message: `Retrieved social media post ${params.postId}`
    };
  }

  private async updateSocialPost(params: MCPUpdatePostParams) {
    const { postId, ...updateData } = params;
    const response = await this.ghlClient.updateSocialPost(postId, updateData);

    return {
      success: true,
      message: `Social media post ${postId} updated successfully`
    };
  }

  private async deleteSocialPost(params: MCPDeletePostParams) {
    const response = await this.ghlClient.deleteSocialPost(params.postId);

    return {
      success: true,
      message: `Social media post ${params.postId} deleted successfully`
    };
  }

  private async bulkDeleteSocialPosts(params: MCPBulkDeletePostsParams) {
    const response = await this.ghlClient.bulkDeleteSocialPosts({ postIds: params.postIds });

    return {
      success: true,
      deletedCount: response.data?.deletedCount || 0,
      message: `${response.data?.deletedCount || 0} social media posts deleted successfully`
    };
  }

  private async getSocialAccounts(params: MCPGetAccountsParams) {
    const response = await this.ghlClient.getSocialAccounts();

    return {
      success: true,
      accounts: response.data?.accounts || [],
      groups: response.data?.groups || [],
      message: `Retrieved ${response.data?.accounts?.length || 0} social media accounts and ${response.data?.groups?.length || 0} groups`
    };
  }

  private async deleteSocialAccount(params: MCPDeleteAccountParams) {
    const response = await this.ghlClient.deleteSocialAccount(
      params.accountId,
      params.companyId,
      params.userId
    );

    return {
      success: true,
      message: `Social media account ${params.accountId} deleted successfully`
    };
  }

  // --- NEW IMPLEMENTATION METHODS FOR CSV TOOLS ---

private async uploadCsv(params: MCPUploadCSVParams) {
    // Call existing method: uploadSocialCSV
    const response = await this.ghlClient.uploadSocialCSV({
      file: params.file
    });

    return {
      success: true,
      uploadData: response.data,
      message: `CSV file uploaded successfully`
    };
  }

  private async getCsvUploadStatus(params: MCPGetUploadStatusParams) {
    // Call existing method: getSocialCSVUploadStatus
    // Note: Passes arguments individually to match your existing API client signature
    const response = await this.ghlClient.getSocialCSVUploadStatus(
      params.skip,
      params.limit,
      params.includeUsers,
      params.userId
    );

    return {
      success: true,
      uploads: response.data?.uploads || [],
      count: response.data?.count || 0,
      message: `Retrieved status for ${response.data?.count || 0} CSV uploads`
    };
  }

  private async setCsvAccounts(params: MCPSetAccountsParams) {
    // Call existing method: setSocialCSVAccounts
    const response = await this.ghlClient.setSocialCSVAccounts({
      accountIds: params.accountIds,
      filePath: params.filePath,
      rowsCount: params.rowsCount,
      fileName: params.fileName,
      approver: params.approver,
      userId: params.userId
    });

    return {
      success: true,
      data: response.data,
      message: `Accounts set for CSV import successfully`
    };
  }
  // -----------------------------------------------

  private async getSocialCategories(params: MCPGetCategoriesParams) {
    const response = await this.ghlClient.getSocialCategories(
      params.searchText,
      params.limit,
      params.skip
    );

    return {
      success: true,
      categories: response.data?.categories || [],
      count: response.data?.count || 0,
      message: `Retrieved ${response.data?.count || 0} social media categories`
    };
  }

  private async getSocialCategory(params: MCPGetCategoryParams) {
    const response = await this.ghlClient.getSocialCategory(params.categoryId);

    return {
      success: true,
      category: response.data?.category,
      message: `Retrieved social media category ${params.categoryId}`
    };
  }

  private async getSocialTags(params: MCPGetTagsParams) {
    const response = await this.ghlClient.getSocialTags(
      params.searchText,
      params.limit,
      params.skip
    );

    return {
      success: true,
      tags: response.data?.tags || [],
      count: response.data?.count || 0,
      message: `Retrieved ${response.data?.count || 0} social media tags`
    };
  }

  private async getSocialTagsByIds(params: MCPGetTagsByIdsParams) {
    const response = await this.ghlClient.getSocialTagsByIds({ tagIds: params.tagIds });

    return {
      success: true,
      tags: response.data?.tags || [],
      count: response.data?.count || 0,
      message: `Retrieved ${response.data?.count || 0} social media tags by IDs`
    };
  }

  private async startSocialOAuth(params: MCPStartOAuthParams) {
    const response = await this.ghlClient.startSocialOAuth(
      params.platform,
      params.userId,
      params.page,
      params.reconnect
    );

    return {
      success: true,
      oauthData: response.data,
      message: `OAuth process started for ${params.platform}`
    };
  }

  private async getPlatformAccounts(params: MCPGetOAuthAccountsParams) {
    let response;
    switch (params.platform) {
      case 'google':
        response = await this.ghlClient.getGoogleBusinessLocations(params.accountId);
        break;
      case 'facebook':
        response = await this.ghlClient.getFacebookPages(params.accountId);
        break;
      case 'instagram':
        response = await this.ghlClient.getInstagramAccounts(params.accountId);
        break;
      case 'linkedin':
        response = await this.ghlClient.getLinkedInAccounts(params.accountId);
        break;
      case 'twitter':
        response = await this.ghlClient.getTwitterProfile(params.accountId);
        break;
      case 'tiktok':
        response = await this.ghlClient.getTikTokProfile(params.accountId);
        break;
      case 'tiktok-business':
        response = await this.ghlClient.getTikTokBusinessProfile(params.accountId);
        break;
      default:
        throw new Error(`Unsupported platform: ${params.platform}`);
    }

    return {
      success: true,
      platformAccounts: response.data,
      message: `Retrieved ${params.platform} accounts for OAuth ID ${params.accountId}`
    };
  }
}
