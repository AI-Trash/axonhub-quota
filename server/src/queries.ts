export const API_KEYS_QUERY = `
  query ApiKeys($first: Int!) {
    apiKeys(first: $first) {
      edges {
        node {
          id
          key
          name
          status
        }
      }
    }
  }
`

export const COST_STATS_BY_API_KEY_QUERY = `
  query CostStatsByApiKey {
    costStatsByAPIKey {
      apiKeyId
      apiKeyName
      cost
    }
  }
`

export const API_KEY_QUOTA_USAGES_QUERY = `
  query ApiKeyQuotaUsages($apiKeyId: ID!) {
    apiKeyQuotaUsages(apiKeyId: $apiKeyId) {
      profileName
      quota {
        requests
        totalTokens
        cost
        period {
          type
        }
      }
      window {
        start
        end
      }
      usage {
        requestCount
        totalTokens
        totalCost
      }
    }
  }
`

export const API_KEY_TOKEN_USAGE_STATS_QUERY = `
  query ApiKeyTokenUsageStats($input: APIKeyTokenUsageStatsInput) {
    apiKeyTokenUsageStats(input: $input) {
      apiKeyId
      inputTokens
      outputTokens
      cachedTokens
      reasoningTokens
    }
  }
`
