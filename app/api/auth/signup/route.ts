import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { userId, fullName, username, phone, referralCode } = await req.json()
    const supabase = createServerSupabaseClient()

    // Generate a unique referral code for the new user
    const myReferralCode = 'VX-' + Math.random().toString(36).substring(2, 8).toUpperCase()

    // Look up referrer if referral code was provided
    let referrerId = null
    if (referralCode) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('my_referral_code', referralCode.trim().toUpperCase())
        .single()
      if (referrer) referrerId = referrer.id
    }

    const { error } = await supabase.from('profiles').insert({
      id: userId,
      full_name: fullName,
      username: username?.toLowerCase() || null,
      phone: phone || null,
      referred_by: referrerId,
      my_referral_code: myReferralCode,
      role: 'user',
      balance: 0,
      status: 'active',
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, referralCode: myReferralCode })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
