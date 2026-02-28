export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'RakuShield Relayer API',
    version: '2.0.0',
    description:
      'Express service for relaying private Starknet transactions and storing note/history metadata.',
  },
  servers: [
    {
      url: '/',
      description: 'Current host',
    },
  ],
  tags: [
    { name: 'Health', description: 'Service health and relayer status' },
    { name: 'Relay', description: 'Fee estimate and relay transaction flow' },
    { name: 'Notes', description: 'Store and query note data' },
    { name: 'History', description: 'Store and query history entries' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Get service health and relayer balance',
        responses: {
          '200': {
            description: 'Health response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
          '500': {
            description: 'Unexpected error while reading relayer status',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/api/estimate-fee': {
      post: {
        tags: ['Relay'],
        summary: 'Estimate relay fee and create quote',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FeeEstimateRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Fee quote generated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FeeEstimateResponse' },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Internal error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FeeEstimateErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/relay': {
      post: {
        tags: ['Relay'],
        summary: 'Relay a signed shielded transaction',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RelayRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Relay successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RelaySuccessResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid request/signature/nonce/quote',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '402': {
            description: 'Fee payment failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '503': {
            description: 'Relayer account is not deployed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Internal relay error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/notes/{zkAddress}': {
      get: {
        tags: ['Notes'],
        summary: 'Get unspent notes by zkAddress',
        parameters: [
          {
            name: 'zkAddress',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Unspent notes list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NoteListResponse' },
              },
            },
          },
          '500': {
            description: 'Internal error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/notes': {
      post: {
        tags: ['Notes'],
        summary: 'Save a note',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SaveNoteRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Note stored',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GenericSuccessResponse' },
              },
            },
          },
          '500': {
            description: 'Internal error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/notes/mark-spent': {
      post: {
        tags: ['Notes'],
        summary: 'Mark note as spent',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MarkNoteAsSpentRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Note marked spent',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GenericSuccessResponse' },
              },
            },
          },
          '404': {
            description: 'Note not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Internal error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/history/{zkAddress}': {
      get: {
        tags: ['History'],
        summary: 'Get history entries by zkAddress',
        parameters: [
          {
            name: 'zkAddress',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'History list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HistoryListResponse' },
              },
            },
          },
          '500': {
            description: 'Internal error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/history': {
      post: {
        tags: ['History'],
        summary: 'Save history entry',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SaveHistoryRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'History stored',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GenericSuccessResponse' },
              },
            },
          },
          '400': {
            description: 'Missing required transaction hash',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Internal error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Validation error' },
        },
        required: ['success', 'error'],
      },
      GenericSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed' },
        },
        required: ['success', 'message'],
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ok', 'error'] },
          relayerAddress: { type: 'string', example: '0xabc...' },
          balance: { type: 'string', example: '0x1234' },
          version: { type: 'string', example: '2.0.0' },
          uptime: { type: 'number', example: 12345 },
        },
        required: ['status', 'relayerAddress', 'balance', 'version', 'uptime'],
      },
      FeeEstimateRequest: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['transfer', 'withdraw'] },
          proof: {
            type: 'array',
            items: { type: 'string' },
            minItems: 3,
            maxItems: 3,
          },
          publicInputs: {
            type: 'array',
            items: { type: 'string' },
          },
          recipient: { type: 'string', nullable: true },
          feeToken: { type: 'string', enum: ['STRK', 'ETH', 'USDC'] },
        },
        required: ['type', 'proof', 'publicInputs', 'feeToken'],
      },
      FeeEstimateResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          estimatedGasFee: { type: 'string', example: '1000000000000000' },
          serviceFee: { type: 'string', example: '150000000000000' },
          totalFee: { type: 'string', example: '1150000000000000' },
          feeToken: { type: 'string', enum: ['STRK', 'ETH', 'USDC'] },
          expiresAt: { type: 'number', example: 1730000000000 },
          quoteId: { type: 'string', example: '7ebc1fd1-9b32-4a21-a59f-c313a3957343' },
        },
        required: [
          'success',
          'estimatedGasFee',
          'serviceFee',
          'totalFee',
          'feeToken',
          'expiresAt',
          'quoteId',
        ],
      },
      FeeEstimateErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          estimatedGasFee: { type: 'string', example: '0' },
          serviceFee: { type: 'string', example: '0' },
          totalFee: { type: 'string', example: '0' },
          feeToken: { type: 'string', enum: ['STRK', 'ETH', 'USDC'] },
          expiresAt: { type: 'number', example: 0 },
          quoteId: { type: 'string', example: '' },
        },
        required: [
          'success',
          'estimatedGasFee',
          'serviceFee',
          'totalFee',
          'feeToken',
          'expiresAt',
          'quoteId',
        ],
      },
      RelayIntent: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['transfer', 'withdraw'] },
          proof: {
            type: 'array',
            items: { type: 'string' },
            minItems: 3,
          },
          publicInputs: {
            type: 'array',
            items: { type: 'string' },
          },
          recipient: { type: 'string', nullable: true },
          userAddress: { type: 'string' },
          timestamp: { type: 'number', example: 1730000000000 },
          nonce: { type: 'string', example: '0x123' },
          signature: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
          },
          feeToken: { type: 'string', enum: ['STRK', 'ETH', 'USDC'] },
          maxFeeAmount: { type: 'string', example: '1000000000000000' },
        },
        required: [
          'type',
          'proof',
          'publicInputs',
          'userAddress',
          'timestamp',
          'nonce',
          'signature',
          'feeToken',
          'maxFeeAmount',
        ],
      },
      RelayRequest: {
        type: 'object',
        properties: {
          quoteId: { type: 'string', nullable: true },
          intent: { $ref: '#/components/schemas/RelayIntent' },
        },
        required: ['intent'],
      },
      RelaySuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          transactionHash: { type: 'string', example: '0xabc' },
          feeCharged: { type: 'string', example: '1150000000000000' },
          feeToken: { type: 'string', enum: ['STRK', 'ETH', 'USDC'] },
          paymentTxHash: { type: 'string', example: '0xmock_payment_tx' },
        },
        required: ['success', 'transactionHash', 'feeCharged', 'feeToken', 'paymentTxHash'],
      },
      Note: {
        type: 'object',
        properties: {
          commitment: { type: 'string' },
          amount: { type: 'string' },
          rho: { type: 'string' },
          rcm: { type: 'string' },
          isSpent: { type: 'boolean' },
          leafIndex: { type: 'number' },
          transactionHash: { type: 'string' },
        },
        required: ['commitment', 'amount', 'rho', 'rcm', 'isSpent'],
      },
      NoteListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          notes: {
            type: 'array',
            items: { $ref: '#/components/schemas/Note' },
          },
        },
        required: ['success', 'notes'],
      },
      SaveNoteRequest: {
        type: 'object',
        properties: {
          zkAddress: { type: 'string' },
          commitment: { type: 'string' },
          amount: { type: 'string' },
          rho: { type: 'string' },
          rcm: { type: 'string' },
          leafIndex: { type: 'number' },
          transactionHash: { type: 'string' },
        },
        required: ['zkAddress', 'commitment', 'amount', 'rho', 'rcm'],
      },
      MarkNoteAsSpentRequest: {
        type: 'object',
        properties: {
          zkAddress: { type: 'string' },
          commitment: { type: 'string' },
        },
        required: ['zkAddress', 'commitment'],
      },
      HistoryItem: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['shield', 'transfer', 'withdraw'] },
          transactionHash: { type: 'string' },
          timestamp: { type: 'number' },
          amount: { type: 'string' },
          recipientZkAddress: { type: 'string', nullable: true },
          recipientPublicAddress: { type: 'string', nullable: true },
        },
        required: ['type', 'transactionHash', 'timestamp', 'amount'],
      },
      HistoryListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          history: {
            type: 'array',
            items: { $ref: '#/components/schemas/HistoryItem' },
          },
        },
        required: ['success', 'history'],
      },
      SaveHistoryRequest: {
        type: 'object',
        properties: {
          zkAddress: { type: 'string' },
          type: { type: 'string', enum: ['shield', 'transfer', 'withdraw'] },
          transactionHash: { type: 'string' },
          timestamp: { type: 'number' },
          amount: { type: 'string' },
          recipientZkAddress: { type: 'string', nullable: true },
          recipientPublicAddress: { type: 'string', nullable: true },
        },
        required: ['zkAddress', 'type', 'transactionHash', 'timestamp', 'amount'],
      },
    },
  },
} as const;
