import { exec, getDB, isMySQL, isPostgres } from '../db.js';

export async function runMigrations(): Promise<void> {
  console.log('[MigrationService] Starting database schema migrations...');
  const isPg = isPostgres();
  const isMysql = isMySQL();
  const conn = getDB();

  if (!conn) {
    throw new Error('[MigrationService] Cannot run migrations: Database connection is not initialized');
  }

  if (isPg || isMysql) {
    // Run schema creations for non-SQLite backends
    await exec(`
      CREATE TABLE IF NOT EXISTS affiliates (
        id VARCHAR(255) PRIMARY KEY,
        tenantId VARCHAR(255),
        userId VARCHAR(255),
        code VARCHAR(255) UNIQUE,
        referralCount INTEGER DEFAULT 0,
        earningsCents INTEGER DEFAULT 0,
        payoutAddress TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch((e:any) => console.error("[MigrationService] block #1 failed:", e?.message));

    await exec(`
      CREATE TABLE IF NOT EXISTS referrals (
        id VARCHAR(255) PRIMARY KEY,
        tenantId VARCHAR(255),
        affiliateId VARCHAR(255),
        referredUserId VARCHAR(255) UNIQUE,
        status VARCHAR(50) DEFAULT 'active',
        subscriptionTier VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch((e:any) => console.error("[MigrationService] block #2 failed:", e?.message));

    await exec(`
      CREATE TABLE IF NOT EXISTS affiliate_commissions (
        id VARCHAR(255) PRIMARY KEY,
        tenantId VARCHAR(255),
        affiliateId VARCHAR(255),
        referredUserId VARCHAR(255),
        amountCents INTEGER,
        subscriptionPaymentId VARCHAR(255),
        payoutStatus VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch((e:any) => console.error("[MigrationService] block #3 failed:", e?.message));

    await exec(`
      CREATE TABLE IF NOT EXISTS print_products (
        id VARCHAR(255) PRIMARY KEY,
        tenantId VARCHAR(255),
        name VARCHAR(255),
        description TEXT,
        basePriceCents INTEGER,
        retailPriceCents INTEGER,
        itemType VARCHAR(50),
        mockupUrl TEXT,
        templateUrl TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch((e:any) => console.error("[MigrationService] block #4 failed:", e?.message));

    await exec(`
      CREATE TABLE IF NOT EXISTS crm_contacts (
        id VARCHAR(255) PRIMARY KEY,
        tenantId VARCHAR(255),
        userId VARCHAR(255),
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        type VARCHAR(50),
        lifecycleStage VARCHAR(50),
        notes TEXT,
        tags TEXT,
        lastInteractionAt TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch((e:any) => console.error("[MigrationService] block #5 failed:", e?.message));

    await exec(`
      CREATE TABLE IF NOT EXISTS crm_interactions (
        id VARCHAR(255) PRIMARY KEY,
        tenantId VARCHAR(255),
        contactId VARCHAR(255),
        userId VARCHAR(255),
        type VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch((e:any) => console.error("[MigrationService] block #6 failed:", e?.message));

    await exec(`
      CREATE TABLE IF NOT EXISTS ai_jobs (
        id VARCHAR(255) PRIMARY KEY,
        tenantId VARCHAR(255),
        userId VARCHAR(255),
        jobType VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        inputUrl TEXT,
        outputUrl TEXT,
        profitFeeRatePercent REAL DEFAULT 5.5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
    `).catch((e:any) => console.error("[MigrationService] block #7 failed:", e?.message));

    await exec(`
      CREATE TABLE IF NOT EXISTS ai_generated_products (
        id VARCHAR(255) PRIMARY KEY,
        tenantId VARCHAR(255),
        productId VARCHAR(255),
        aiJobId VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch((e:any) => console.error("[MigrationService] block #8 failed:", e?.message));

    await exec(`
      CREATE TABLE IF NOT EXISTS video_compilations (
        id VARCHAR(255) PRIMARY KEY,
        track_ids TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch((e:any) => console.error("[MigrationService] block #9 failed:", e?.message));

    await exec(`
      CREATE TABLE IF NOT EXISTS autopilot_runs (
        id VARCHAR(255) PRIMARY KEY,
        template_key VARCHAR(100),
        product_id VARCHAR(255),
        product_name VARCHAR(255),
        price REAL,
        image_url TEXT,
        status VARCHAR(50),
        error_log TEXT,
        started_at TIMESTAMP,
        finished_at TIMESTAMP
      );
    `).catch((e:any) => console.error("[MigrationService] block #10 failed:", e?.message));

    await exec(`
      CREATE TABLE IF NOT EXISTS social_post_drafts (
        id VARCHAR(255) PRIMARY KEY,
        run_id VARCHAR(255),
        platform VARCHAR(50),
        method VARCHAR(50),
        share_url TEXT,
        caption TEXT,
        pacing_note TEXT,
        status VARCHAR(50) DEFAULT 'ready',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch((e:any) => console.error("[MigrationService] block #11 failed:", e?.message));
  } else {
    // Initialize schema for SQLite
    await exec(`
      CREATE TABLE IF NOT EXISTS playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        title TEXT,
        description TEXT,
        artwork_url TEXT,
        cover_type TEXT DEFAULT 'custom',
        is_public INTEGER DEFAULT 1,
        is_collaborative INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS playlist_collaborators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playlist_id INTEGER,
        user_id TEXT,
        role TEXT DEFAULT 'editor',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(playlist_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS playlist_tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playlist_id INTEGER,
        track_id INTEGER,
        position INTEGER,
        added_by TEXT,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(playlist_id, track_id)
      );

      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        product_id TEXT,
        seller_id TEXT,
        quantity INTEGER DEFAULT 1,
        price REAL,
        fulfillment_method TEXT DEFAULT 'self',
        external_fulfillment_service TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        name TEXT,
        password TEXT,
        user_type TEXT DEFAULT 'listener',
        is_pro INTEGER DEFAULT 0,
        subscription_tier TEXT DEFAULT 'free',
        balance REAL DEFAULT 0,
        email_verified INTEGER DEFAULT 0,
        avatar_url TEXT,
        bio TEXT,
        social_links TEXT,
        preferred_genres TEXT,
        stripe_account_id TEXT,
        ai_generations_count INTEGER DEFAULT 0,
        last_ai_generation_reset DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_verified INTEGER DEFAULT 0,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        type TEXT,
        preview_url TEXT,
        config TEXT,
        required_tier TEXT DEFAULT 'SonicPro',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS artists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        name TEXT,
        type TEXT,
        genre TEXT,
        duration INTEGER,
        price REAL,
        bio TEXT,
        image_url TEXT,
        location TEXT,
        riders TEXT,
        market_pricing TEXT,
        follower_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_user_id TEXT,
        primary_artist_id TEXT,
        display_artist_name TEXT,
        user_id TEXT,
        artist_id TEXT,
        artist TEXT,
        title TEXT,
        album TEXT,
        genre TEXT,
        price REAL,
        is_video INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        moderation_status TEXT DEFAULT 'pending',
        file_url TEXT,
        stream_url TEXT,
        hls_url TEXT,
        dash_url TEXT,
        preview_url TEXT,
        artwork_url TEXT,
        mood TEXT,
        lyrics TEXT,
        description TEXT,
        isrc TEXT,
        upc TEXT,
        editorial_featured INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS play_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        track_id INTEGER,
        duration INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        target_id TEXT,
        target_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, target_id, target_type)
      );

      PRAGMA table_info(tracks);
    `);

    // Helper to add column if not exists in SQLite
    const addColumnIfNotExists = async (table: string, column: string, type: string) => {
      const tableExists = await (conn as any).get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [table]
      );
      if (!tableExists) {
        return;
      }
      const info = await (conn as any).all(`PRAGMA table_info(${table})`);
      if (!info.find((c: any) => c.name === column)) {
        await exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
      }
    };

    await addColumnIfNotExists('playlists', 'cover_type', "TEXT DEFAULT 'custom'");
    await addColumnIfNotExists('playlists', 'is_collaborative', 'INTEGER DEFAULT 0');
    await addColumnIfNotExists('playlist_tracks', 'added_by', 'TEXT');
    await addColumnIfNotExists('tracks', 'owner_user_id', 'TEXT');
    await addColumnIfNotExists('tracks', 'primary_artist_id', 'TEXT');
    await addColumnIfNotExists('tracks', 'display_artist_name', 'TEXT');
    await addColumnIfNotExists('tracks', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    await addColumnIfNotExists('tracks', 'album', 'TEXT');
    await addColumnIfNotExists('tracks', 'lyrics', 'TEXT');
    await addColumnIfNotExists('tracks', 'description', 'TEXT');
    await addColumnIfNotExists('tracks', 'hls_url', 'TEXT');
    await addColumnIfNotExists('tracks', 'dash_url', 'TEXT');
    await addColumnIfNotExists('artists', 'revenue_breakdown', 'TEXT');
    await addColumnIfNotExists('artists', 'demographics', 'TEXT');
    await addColumnIfNotExists('users', 'payout_threshold', 'REAL DEFAULT 10.0');
    await addColumnIfNotExists('ai_templates', 'required_tier', "TEXT DEFAULT 'SonicPro'");
    await addColumnIfNotExists('ads', 'post_id', 'INTEGER');
    await addColumnIfNotExists('users', 'is_verified', 'INTEGER DEFAULT 0');
    await addColumnIfNotExists('tracks', 'copyright_holder', 'TEXT');
    await addColumnIfNotExists('tracks', 'rights_verified', 'INTEGER DEFAULT 0');
    await addColumnIfNotExists('tracks', 'takedown_status', "TEXT DEFAULT 'active'");
    await addColumnIfNotExists('tracks', 'dispute_status', "TEXT DEFAULT 'none'");
    await addColumnIfNotExists('tracks', 'label_name', 'TEXT');
    await addColumnIfNotExists('tracks', 'p_line', 'TEXT');
    await addColumnIfNotExists('tracks', 'c_line', 'TEXT');
    await addColumnIfNotExists('users', 'credits', 'REAL DEFAULT 0');
    await addColumnIfNotExists('users', 'subscription_id', 'TEXT');
    await addColumnIfNotExists('users', 'stripe_customer_id', 'TEXT');
    await addColumnIfNotExists('users', 'stripe_account_id', 'TEXT');
    await addColumnIfNotExists('users', 'payout_enabled', 'INTEGER DEFAULT 0');
    await addColumnIfNotExists('users', 'loyalty_score', 'REAL DEFAULT 0.5');
    await addColumnIfNotExists('users', 'fraud_risk_score', 'REAL DEFAULT 0.1');

    await addColumnIfNotExists('users', 'tenant_id', 'TEXT');
    await addColumnIfNotExists('artists', 'user_id', 'TEXT');
    await addColumnIfNotExists('artists', 'tenant_id', 'TEXT');
    await addColumnIfNotExists('tracks', 'release_id', 'TEXT');
    await addColumnIfNotExists('tracks', 'tenant_id', 'TEXT');
    await addColumnIfNotExists('tracks', 'audio_url', 'TEXT');
    await addColumnIfNotExists('tracks', 'position', 'INTEGER');
    await addColumnIfNotExists('tracks', 'explicit', 'INTEGER DEFAULT 0');
    await addColumnIfNotExists('tracks', 'duration', 'REAL DEFAULT 0');
    await addColumnIfNotExists('payouts', 'tenant_id', 'TEXT');
    await addColumnIfNotExists('payouts', 'fee', 'REAL');
    await addColumnIfNotExists('payouts', 'net_amount', 'REAL');
    await addColumnIfNotExists('payouts', 'stripe_transfer_id', 'TEXT');
    await addColumnIfNotExists('payouts', 'requested_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    await addColumnIfNotExists('payouts', 'method', 'TEXT');
    await addColumnIfNotExists('users', 'phone', 'TEXT');
    await addColumnIfNotExists('users', 'push_token', 'TEXT');

    await exec(`
      CREATE TABLE IF NOT EXISTS sms_notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        phone TEXT,
        message TEXT,
        status TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS email_notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        email TEXT,
        subject TEXT,
        status TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS push_notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        push_token TEXT,
        title TEXT,
        body TEXT,
        status TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rights_splits (
        id TEXT PRIMARY KEY,
        track_id TEXT,
        artist_id TEXT,
        ownership_share REAL DEFAULT 100.0,
        publishing_share REAL DEFAULT 100.0,
        mechanical_share REAL DEFAULT 100.0,
        neighboring_share REAL DEFAULT 100.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS marketing_campaigns (
        id TEXT PRIMARY KEY,
        artist_id TEXT,
        name TEXT,
        trigger_type TEXT,
        subject TEXT,
        body TEXT,
        target_segment TEXT DEFAULT 'all',
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS campaign_subscribers (
        id TEXT PRIMARY KEY,
        campaign_id TEXT,
        user_id TEXT,
        status TEXT,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await exec(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT,
        slug TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS releases (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        user_id TEXT,
        artist_id TEXT,
        title TEXT,
        type TEXT,
        status TEXT DEFAULT 'DRAFT',
        upc TEXT UNIQUE,
        artwork_url TEXT,
        release_date DATETIME,
        genre TEXT,
        label TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(tenant_id) REFERENCES tenants(id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(artist_id) REFERENCES artists(id)
      );

      CREATE TABLE IF NOT EXISTS dsp_providers (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE,
        active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS dsp_deliveries (
        id TEXT PRIMARY KEY,
        release_id TEXT,
        dsp_id TEXT,
        status TEXT DEFAULT 'PENDING',
        external_id TEXT,
        error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(release_id) REFERENCES releases(id),
        FOREIGN KEY(dsp_id) REFERENCES dsp_providers(id)
      );

      CREATE TABLE IF NOT EXISTS royalties (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        user_id TEXT,
        release_id TEXT,
        track_id TEXT,
        revenue_type TEXT,
        amount REAL,
        currency TEXT DEFAULT 'USD',
        source TEXT,
        streams INTEGER,
        period_start DATETIME,
        period_end DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(tenant_id) REFERENCES tenants(id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(release_id) REFERENCES releases(id)
      );

      CREATE TABLE IF NOT EXISTS event_logs (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        event_type TEXT,
        payload TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(tenant_id) REFERENCES tenants(id)
      );
    `);

    await exec(`
      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE,
        currency TEXT DEFAULT 'USD',
        available_balance REAL DEFAULT 0,
        pending_balance REAL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS idempotency_keys (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE,
        response TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ledger_transactions (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        user_id TEXT,
        type TEXT,
        amount REAL,
        currency TEXT DEFAULT 'USD',
        status TEXT DEFAULT 'pending',
        reference TEXT,
        stripe_session_id TEXT UNIQUE,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS ledger_entries (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        transaction_id TEXT,
        account_type TEXT,
        user_id TEXT,
        type TEXT,
        amount REAL,
        currency TEXT DEFAULT 'USD',
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(transaction_id) REFERENCES ledger_transactions(id)
      );

      CREATE TABLE IF NOT EXISTS stripe_events (
        id TEXT PRIMARY KEY,
        type TEXT,
        processed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payouts (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        tenant_id TEXT,
        amount REAL,
        fee REAL,
        net_amount REAL,
        currency TEXT DEFAULT 'USD',
        stripe_transfer_id TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS user_financial_features (
        user_id TEXT PRIMARY KEY,
        tenant_id TEXT,
        total_revenue REAL DEFAULT 0,
        avg_transaction REAL DEFAULT 0,
        refund_rate REAL DEFAULT 0,
        stream_count INTEGER DEFAULT 0,
        growth_rate REAL DEFAULT 0,
        risk_score REAL DEFAULT 20,
        revenue_score REAL DEFAULT 0,
        trust_score REAL DEFAULT 50,
        predicted_30d_revenue REAL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS brain_decisions (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        user_id TEXT,
        engine TEXT,
        input_data TEXT,
        output_result TEXT,
        decision_label TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS brain_audit_logs (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        action TEXT,
        actor_id TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await exec(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artist_id INTEGER,
        user_id TEXT,
        customer_name TEXT,
        customer_email TEXT,
        start_time DATETIME,
        end_time DATETIME,
        status TEXT DEFAULT 'pending',
        payment_status TEXT DEFAULT 'pending',
        total_amount REAL,
        deposit_amount REAL,
        commission_amount REAL,
        rider_costs REAL DEFAULT 0,
        performance_guarantee_id TEXT,
        default_fee_applied INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await exec(`
      CREATE TABLE IF NOT EXISTS artist_availability (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artist_id INTEGER,
        day_of_week INTEGER,
        start_time TEXT,
        end_time TEXT
      );
    `);

    await exec(`
      CREATE TABLE IF NOT EXISTS rss_feeds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        type TEXT,
        category TEXT,
        media_url TEXT,
        author_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        type TEXT,
        message TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        service_name TEXT,
        api_key TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await exec(`
      CREATE TABLE IF NOT EXISTS printorders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userid TEXT,
        paymentintentid TEXT,
        customeremail TEXT,
        cart TEXT,
        shippingaddress TEXT,
        amountcharged REAL,
        zoocostestimate REAL,
        profitestimate REAL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await exec(`
      CREATE TABLE IF NOT EXISTS adminlogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        adminid INTEGER,
        action TEXT,
        targettype TEXT,
        targetid INTEGER,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notification_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE,
        bookings INTEGER DEFAULT 1,
        royalties INTEGER DEFAULT 1,
        distribution INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS distribution_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id INTEGER,
        isrc TEXT,
        upc TEXT,
        platforms TEXT,
        status TEXT,
        external_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS delivery_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id INTEGER,
        platform_id INTEGER,
        platform_name TEXT,
        status TEXT DEFAULT 'pending',
        external_id TEXT,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS playlist_curators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        genre TEXT,
        followers INTEGER,
        email TEXT,
        spotify TEXT,
        response_rate REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS direct_sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id INTEGER,
        amount REAL,
        artist_revenue REAL,
        platform_revenue REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS curation_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id INTEGER,
        user_id TEXT,
        pitch TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artist_id INTEGER,
        title TEXT,
        description TEXT,
        date DATETIME,
        venue TEXT,
        city TEXT,
        price REAL,
        tickets_available INTEGER,
        image_url TEXT,
        lat REAL,
        lng REAL,
        genre TEXT,
        popularity INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS royalty_statements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        platform_id TEXT,
        track_id INTEGER,
        amount REAL,
        period_start DATETIME,
        period_end DATETIME,
        streams INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS followers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        artist_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, artist_id)
      );

      CREATE TABLE IF NOT EXISTS user_follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_id TEXT,
        following_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      );

      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        content TEXT,
        media_url TEXT,
        type TEXT DEFAULT 'text',
        is_promotion INTEGER DEFAULT 0,
        price REAL DEFAULT 0,
        product_link TEXT,
        track_link TEXT,
        cta_link TEXT,
        cta_text TEXT,
        external_share TEXT,
        subscription_tier_requirement TEXT DEFAULT 'everyone',
        status TEXT DEFAULT 'live',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS marketing_scripts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT UNIQUE,
        visual TEXT,
        speaker_notes TEXT,
        display_order INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS post_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER,
        user_id TEXT,
        type TEXT,
        comment_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_integrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        service_name TEXT, 
        access_token TEXT,
        refresh_token TEXT,
        expiry_date INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, service_name)
      );

      CREATE TABLE IF NOT EXISTS ads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_id TEXT,
        post_id INTEGER,
        target_demo TEXT,
        budget REAL,
        creative_url TEXT,
        brand_safety TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id TEXT,
        receiver_id TEXT,
        group_id INTEGER,
        content TEXT,
        media_url TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS stream_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id INTEGER,
        user_id TEXT,
        country TEXT,
        device TEXT,
        duration INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        avatar_url TEXT,
        creator_id TEXT,
        is_private INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS group_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER,
        user_id TEXT,
        role TEXT DEFAULT 'member',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS vfx_projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        prompt TEXT,
        status TEXT DEFAULT 'pending',
        preview_url TEXT,
        final_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS artist_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        id_url TEXT,
        social_links TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS event_sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        user_id TEXT,
        amount REAL,
        tickets INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS artist_sites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artist_id INTEGER,
        subdomain TEXT UNIQUE,
        theme TEXT,
        layout TEXT,
        components TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS copyright_takedowns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id INTEGER,
        reporter_id TEXT,
        reason TEXT,
        evidence_url TEXT,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        name TEXT,
        tier TEXT,
        price REAL,
        interval TEXT,
        features TEXT
      );

      CREATE TABLE IF NOT EXISTS credit_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        amount REAL,
        type TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        title TEXT,
        hostId TEXT,
        type TEXT DEFAULT 'audio',
        status TEXT DEFAULT 'live',
        isPaid INTEGER DEFAULT 0,
        price REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS room_participants (
        roomId TEXT,
        userId TEXT,
        role TEXT DEFAULT 'listener',
        joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(roomId, userId)
      );

      CREATE TABLE IF NOT EXISTS room_purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        roomId TEXT,
        userId TEXT,
        amount REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(roomId, userId)
      );

      CREATE TABLE IF NOT EXISTS event_highlights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT,
        title TEXT,
        clip_url TEXT,
        activity_level INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS active_polls (
        roomId TEXT PRIMARY KEY,
        id TEXT,
        question TEXT,
        options TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS affiliates (
        id VARCHAR(255) PRIMARY KEY,
        tenantId VARCHAR(255),
        userId VARCHAR(255),
        code VARCHAR(255) UNIQUE,
        referralCount INTEGER DEFAULT 0,
        earningsCents INTEGER DEFAULT 0,
        payoutAddress TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS referrals (
        id VARCHAR(255) PRIMARY KEY,
        tenantId VARCHAR(255),
        affiliateId VARCHAR(255),
        referredUserId VARCHAR(255) UNIQUE,
        status VARCHAR(50) DEFAULT 'active',
        subscriptionTier VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS affiliate_commissions (
        id VARCHAR(255) PRIMARY KEY,
        tenantId VARCHAR(255),
        affiliateId VARCHAR(255),
        referredUserId VARCHAR(255),
        amountCents INTEGER,
        subscriptionPaymentId VARCHAR(255),
        payoutStatus VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS print_products (
        id VARCHAR(255) PRIMARY KEY,
        tenantId VARCHAR(255),
        name VARCHAR(255),
        description TEXT,
        basePriceCents INTEGER,
        retailPriceCents INTEGER,
        itemType VARCHAR(50),
        mockupUrl TEXT,
        templateUrl TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS crm_contacts (
        id VARCHAR(255) PRIMARY KEY,
        tenantId VARCHAR(255),
        userId VARCHAR(255),
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        type VARCHAR(50),
        lifecycleStage VARCHAR(50),
        notes TEXT,
        tags TEXT,
        lastInteractionAt TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS crm_interactions (
        id VARCHAR(255) PRIMARY KEY,
        tenantId VARCHAR(255),
        contactId VARCHAR(255),
        userId VARCHAR(255),
        type VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_jobs (
        id VARCHAR(255) PRIMARY KEY,
        tenantId VARCHAR(255),
        userId VARCHAR(255),
        jobType VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        inputUrl TEXT,
        outputUrl TEXT,
        profitFeeRatePercent REAL DEFAULT 5.5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_generated_products (
        id VARCHAR(255) PRIMARY KEY,
        tenantId VARCHAR(255),
        productId VARCHAR(255),
        aiJobId VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS video_compilations (
        id VARCHAR(255) PRIMARY KEY,
        track_ids TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS autopilot_runs (
        id VARCHAR(255) PRIMARY KEY,
        template_key VARCHAR(100),
        product_id VARCHAR(255),
        product_name VARCHAR(255),
        price REAL,
        image_url TEXT,
        status VARCHAR(50),
        error_log TEXT,
        started_at TIMESTAMP,
        finished_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS social_post_drafts (
        id VARCHAR(255) PRIMARY KEY,
        run_id VARCHAR(255),
        platform VARCHAR(50),
        method VARCHAR(50),
        share_url TEXT,
        caption TEXT,
        pacing_note TEXT,
        status VARCHAR(50) DEFAULT 'ready',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  if (isMysql) {
    await exec(`
      CREATE TABLE IF NOT EXISTS active_polls (
        roomId VARCHAR(255) PRIMARY KEY,
        id VARCHAR(255),
        question TEXT,
        options TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch((e:any) => console.error("[MigrationService] block #12 failed:", e?.message));
    await exec(`ALTER TABLE posts ADD COLUMN subscription_tier_requirement VARCHAR(255) DEFAULT 'everyone'`).catch((e:any) => console.error("[MigrationService] block #13 failed:", e?.message));
    await exec(`ALTER TABLE posts ADD COLUMN track_link VARCHAR(500)`).catch((e:any) => console.error("[MigrationService] block #14 failed:", e?.message));
  } else {
    await exec(`ALTER TABLE posts ADD COLUMN subscription_tier_requirement TEXT DEFAULT 'everyone'`).catch((e:any) => console.error("[MigrationService] block #15 failed:", e?.message));
    await exec(`ALTER TABLE posts ADD COLUMN track_link TEXT`).catch((e:any) => console.error("[MigrationService] block #16 failed:", e?.message));
  }

  // User Subscription Fields
  if (isMysql || isPostgres()) {
    await exec(`ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(50) DEFAULT 'free'`).catch((e:any) => console.error("[MigrationService] block #17 failed:", e?.message));
    await exec(`ALTER TABLE users ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'active'`).catch((e:any) => console.error("[MigrationService] block #18 failed:", e?.message));
    await exec(`ALTER TABLE users ADD COLUMN subscription_expires_at TIMESTAMP`).catch((e:any) => console.error("[MigrationService] block #19 failed:", e?.message));
    await exec(`ALTER TABLE users ADD COLUMN subscription_cancel_at TIMESTAMP`).catch((e:any) => console.error("[MigrationService] block #20 failed:", e?.message));
  } else {
    await exec(`ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free'`).catch((e:any) => console.error("[MigrationService] block #21 failed:", e?.message));
    await exec(`ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'active'`).catch((e:any) => console.error("[MigrationService] block #22 failed:", e?.message));
    await exec(`ALTER TABLE users ADD COLUMN subscription_expires_at DATETIME`).catch((e:any) => console.error("[MigrationService] block #23 failed:", e?.message));
    await exec(`ALTER TABLE users ADD COLUMN subscription_cancel_at DATETIME`).catch((e:any) => console.error("[MigrationService] block #24 failed:", e?.message));
  }

  // Subscription Details Column Extensions (Sync Stripe subscription attributes on standard table)
  if (isMysql || isPostgres()) {
    await exec(`ALTER TABLE subscriptions ADD COLUMN user_id VARCHAR(255)`).catch((e:any) => console.error("[MigrationService] block #25 failed:", e?.message));
    await exec(`ALTER TABLE subscriptions ADD COLUMN stripe_subscription_id VARCHAR(255)`).catch((e:any) => console.error("[MigrationService] block #26 failed:", e?.message));
    await exec(`ALTER TABLE subscriptions ADD COLUMN stripe_customer_id VARCHAR(255)`).catch((e:any) => console.error("[MigrationService] block #27 failed:", e?.message));
    await exec(`ALTER TABLE subscriptions ADD COLUMN status VARCHAR(20)`).catch((e:any) => console.error("[MigrationService] block #28 failed:", e?.message));
    await exec(`ALTER TABLE subscriptions ADD COLUMN current_period_start TIMESTAMP`).catch((e:any) => console.error("[MigrationService] block #29 failed:", e?.message));
    await exec(`ALTER TABLE subscriptions ADD COLUMN current_period_end TIMESTAMP`).catch((e:any) => console.error("[MigrationService] block #30 failed:", e?.message));
    await exec(`ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE`).catch((e:any) => console.error("[MigrationService] block #31 failed:", e?.message));
    await exec(`ALTER TABLE subscriptions ADD COLUMN updated_at TIMESTAMP`).catch((e:any) => console.error("[MigrationService] block #32 failed:", e?.message));
  } else {
    await exec(`ALTER TABLE subscriptions ADD COLUMN user_id TEXT`).catch((e:any) => console.error("[MigrationService] block #33 failed:", e?.message));
    await exec(`ALTER TABLE subscriptions ADD COLUMN stripe_subscription_id TEXT`).catch((e:any) => console.error("[MigrationService] block #34 failed:", e?.message));
    await exec(`ALTER TABLE subscriptions ADD COLUMN stripe_customer_id TEXT`).catch((e:any) => console.error("[MigrationService] block #35 failed:", e?.message));
    await exec(`ALTER TABLE subscriptions ADD COLUMN status TEXT`).catch((e:any) => console.error("[MigrationService] block #36 failed:", e?.message));
    await exec(`ALTER TABLE subscriptions ADD COLUMN current_period_start DATETIME`).catch((e:any) => console.error("[MigrationService] block #37 failed:", e?.message));
    await exec(`ALTER TABLE subscriptions ADD COLUMN current_period_end DATETIME`).catch((e:any) => console.error("[MigrationService] block #38 failed:", e?.message));
    await exec(`ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end INTEGER DEFAULT 0`).catch((e:any) => console.error("[MigrationService] block #39 failed:", e?.message));
    await exec(`ALTER TABLE subscriptions ADD COLUMN updated_at DATETIME`).catch((e:any) => console.error("[MigrationService] block #40 failed:", e?.message));
  }

  // Feature Flags Table Configuration
  if (isMysql || isPostgres()) {
    await exec(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        tiers TEXT NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch((e:any) => console.error("[MigrationService] block #41 failed:", e?.message));
  } else {
    await exec(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tiers TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch((e:any) => console.error("[MigrationService] block #42 failed:", e?.message));
  }

  // System Settings Table Configuration
  if (isMysql || isPostgres()) {
    await exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(255) PRIMARY KEY,
        setting_value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch((e:any) => console.error("[MigrationService] block #43 failed:", e?.message));
  } else {
    await exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch((e:any) => console.error("[MigrationService] block #44 failed:", e?.message));
  }

  // Seed default highlight threshold setting if not exists
  const envType = process.env.NODE_ENV || 'development';
  const initialThreshold = envType === 'production' ? '10' : (envType === 'staging' ? '8' : '5');
  await exec(`
    INSERT INTO system_settings (setting_key, setting_value)
    VALUES ('highlight_activity_threshold', '${initialThreshold}')
  `).catch((e:any) => console.error("[MigrationService] block #45 failed:", e?.message));

  // Column displaying order structure or constraints setups
  if (isMysql) {
    await exec('ALTER TABLE marketing_scripts ADD COLUMN display_order INT').catch((e:any) => console.error("[MigrationService] block #46 failed:", e?.message));
    await exec('UPDATE marketing_scripts SET display_order = `order` WHERE display_order IS NULL').catch((e:any) => console.error("[MigrationService] block #47 failed:", e?.message));
    await exec('ALTER TABLE ai_templates ADD UNIQUE INDEX idx_template_name (name)').catch((e:any) => console.error("[MigrationService] block #48 failed:", e?.message));
    await exec('ALTER TABLE marketing_scripts ADD UNIQUE INDEX idx_script_title (title)').catch((e:any) => console.error("[MigrationService] block #49 failed:", e?.message));
  } else {
    await exec('ALTER TABLE marketing_scripts ADD COLUMN display_order INTEGER').catch((e:any) => console.error("[MigrationService] block #50 failed:", e?.message));
    try {
      await exec('UPDATE marketing_scripts SET display_order = "order" WHERE display_order IS NULL');
    } catch {
      // Ignore fallback if legacy column not present
    }
    await exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_template_name ON ai_templates(name)').catch((e:any) => console.error("[MigrationService] block #51 failed:", e?.message));
    await exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_script_title ON marketing_scripts(title)').catch((e:any) => console.error("[MigrationService] block #52 failed:", e?.message));
  }

  console.log('[MigrationService] Database schema migrations completed successfully.');
}

/**
 * Cleanup duplicates on demand or via management scripts
 */
export async function runDuplicateCleanup(): Promise<void> {
  console.log('[MigrationService] Checking/removing accidental table duplicates...');
  const isPg = isPostgres();
  const isMysql = isMySQL();

  try {
    if (isPg) {
      await exec('DELETE FROM ai_templates WHERE id NOT IN (SELECT MIN(id) FROM (SELECT MIN(id) as id, name FROM ai_templates GROUP BY name) x)');
      await exec('DELETE FROM marketing_scripts WHERE id NOT IN (SELECT MIN(id) FROM (SELECT MIN(id) as id, title FROM marketing_scripts GROUP BY title) x)');
    } else if (isMysql) {
      await exec('DELETE t1 FROM ai_templates t1 INNER JOIN ai_templates t2 WHERE t1.id > t2.id AND t1.name = t2.name').catch((e:any) => console.error("[MigrationService] block #53 failed:", e?.message));
      await exec('DELETE s1 FROM marketing_scripts s1 INNER JOIN marketing_scripts s2 WHERE s1.id > s2.id AND s1.title = s2.title').catch((e:any) => console.error("[MigrationService] block #54 failed:", e?.message));
    } else {
      await exec('DELETE FROM ai_templates WHERE id NOT IN (SELECT MIN(id) FROM ai_templates GROUP BY name)');
      await exec('DELETE FROM marketing_scripts WHERE id NOT IN (SELECT MIN(id) FROM marketing_scripts GROUP BY title)');
    }
    console.log('[MigrationService] Duplicate records cleanup finished cleanly.');
  } catch (err: any) {
    console.warn('[MigrationService] Duplicate records cleanup encountered warnings (safe to ignore):', err.message);
  }
}
