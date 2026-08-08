import membershipCheckoutHandler from '../../server-lib/api-routes/membership/checkout.js';

export default async function handler(req, res) {
  return membershipCheckoutHandler(req, res);
}
