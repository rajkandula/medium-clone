import mongoose from 'mongoose';
import crypto from 'crypto';

const OAuthClientSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true },
  clientName: { type: String, default: 'MCP Client' },
  redirectUris: [{ type: String }],
  grantTypes: [{ type: String }],
  tokenEndpointAuthMethod: { type: String, default: 'none' },
}, { timestamps: true });

OAuthClientSchema.statics.generateClientId = function () {
  return `bw_client_${crypto.randomBytes(16).toString('hex')}`;
};

export default mongoose.models.OAuthClient || mongoose.model('OAuthClient', OAuthClientSchema);
