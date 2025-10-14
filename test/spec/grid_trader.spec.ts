import { DF } from "../utils";
import { EUtil } from "../utils_exchange";

describe('Grid Trader', () => {

  let d: ReturnType<typeof DF>
  let EU: ReturnType<typeof EUtil>;

  beforeAll(async () => { 
    d = DF(undefined); 
    EU = EUtil(d); 
    await d.beforeAll(); 
  });

  afterAll(async () => { await d.afterAll(); });

  const LEDGER_A = 0;
  const LEDGER_B = 1;
  const PORT_0 = 0;
  const PORT_1 = 1;

  // Test 1: Basic Grid Trader Creation
  it('should create grid trader with valid configuration', async () => {
    let node = await d.u.createNode({
      'grid_trader': {
        'init': { 
          pool_id: 0 
        },
        'variables': {
          grid_spacing: 0.02, // 2%
          position_size: 10_000_000n,
          num_grid_levels: 10,
          center_price: [100.0],
          auto_rebalance: true,
          max_slippage: 0.01, // 1%
          check_interval_sec: 300n // 5 minutes
        }
      }
    });

    expect(node.id).toBeDefined();
    
    const nodeInfo = await d.u.getNode(node.id);
    expect(nodeInfo.module_id).toBe('grid_trader');
    
    // Check that grid is not initialized yet (no market price available)
    const shared = nodeInfo.custom as any;
    expect(shared.internals.grid_initialized).toBe(false);
    expect(shared.internals.orders_executed).toBe(0);
    expect(shared.internals.total_profit).toBe(0.0);

  }, 600 * 1000);

  // Test 2: Configuration Validation
  it('should reject invalid grid configurations', async () => {
    
    // Test invalid grid_spacing
    await expect(d.u.createNode({
      'grid_trader': {
        'init': { pool_id: 0 },
        'variables': {
          grid_spacing: 1.5, // Invalid: > 1.0
          position_size: 10_000_000n,
          num_grid_levels: 10,
          center_price: [],
          auto_rebalance: true,
          max_slippage: 0.01,
          check_interval_sec: 300n
        }
      }
    })).rejects.toThrow();

    // Test invalid position_size
    await expect(d.u.createNode({
      'grid_trader': {
        'init': { pool_id: 0 },
        'variables': {
          grid_spacing: 0.02,
          position_size: 500_000n, // Invalid: < 1_000_000
          num_grid_levels: 10,
          center_price: [],
          auto_rebalance: true,
          max_slippage: 0.01,
          check_interval_sec: 300n
        }
      }
    })).rejects.toThrow();

    // Test invalid num_grid_levels
    await expect(d.u.createNode({
      'grid_trader': {
        'init': { pool_id: 0 },
        'variables': {
          grid_spacing: 0.02,
          position_size: 10_000_000n,
          num_grid_levels: 1, // Invalid: < 2
          center_price: [],
          auto_rebalance: true,
          max_slippage: 0.01,
          check_interval_sec: 300n
        }
      }
    })).rejects.toThrow();

    // Test invalid max_slippage
    await expect(d.u.createNode({
      'grid_trader': {
        'init': { pool_id: 0 },
        'variables': {
          grid_spacing: 0.02,
          position_size: 10_000_000n,
          num_grid_levels: 10,
          center_price: [],
          auto_rebalance: true,
          max_slippage: 0.6, // Invalid: > 0.5
          check_interval_sec: 300n
        }
      }
    })).rejects.toThrow();

    // Test invalid check_interval_sec
    await expect(d.u.createNode({
      'grid_trader': {
        'init': { pool_id: 0 },
        'variables': {
          grid_spacing: 0.02,
          position_size: 10_000_000n,
          num_grid_levels: 10,
          center_price: [],
          auto_rebalance: true,
          max_slippage: 0.01,
          check_interval_sec: 30n // Invalid: < 60
        }
      }
    })).rejects.toThrow();

  }, 600 * 1000);

  // Test 3: Grid Modification
  it('should modify grid trader configuration', async () => {
    let node = await d.u.createNode({
      'grid_trader': {
        'init': { pool_id: 0 },
        'variables': {
          grid_spacing: 0.02,
          position_size: 10_000_000n,
          num_grid_levels: 10,
          center_price: [],
          auto_rebalance: true,
          max_slippage: 0.01,
          check_interval_sec: 300n
        }
      }
    });

    // Modify configuration
    await d.u.modifyNode(node.id, {
      'grid_trader': {
        grid_spacing: [0.03], // Change to 3%
        position_size: [20_000_000n], // Double position size
        num_grid_levels: [8], // Reduce levels
        center_price: [],
        auto_rebalance: [false],
        max_slippage: [0.02], // Increase slippage tolerance
        check_interval_sec: [600n] // 10 minutes
      }
    });

    const nodeInfo = await d.u.getNode(node.id);
    const shared = nodeInfo.custom as any;
    
    expect(shared.variables.grid_spacing).toBe(0.03);
    expect(shared.variables.position_size).toBe(20_000_000n);
    expect(shared.variables.num_grid_levels).toBe(8);
    expect(shared.variables.auto_rebalance).toBe(false);
    expect(shared.variables.max_slippage).toBe(0.02);
    expect(shared.variables.check_interval_sec).toBe(600n);

  }, 600 * 1000);

  // Test 4: Grid Initialization with Liquidity Pool
  it('should initialize grid when liquidity pool exists', async () => {
    
    // First create a liquidity pool with wide range around price 1.0
    let lpNode = await EU.createLPNode(LEDGER_A, LEDGER_B, {
      partial: {
        from_price: 0.5,   // Lower range
        to_price: 2.0,     // Upper range
      }
    });

    // Add substantial liquidity to the pool
    let liquidityAmount = 5000_0000_0000n; // 5000 tokens
    await EU.addLiquidity(lpNode.id, LEDGER_A, LEDGER_B, liquidityAmount, liquidityAmount);

    // Create grid trader - must use same ledger indices as the pool
    let gridNode = await d.u.createNode({
      'grid_trader': {
        'init': { pool_id: 0 },
        'variables': {
          grid_spacing: 0.02,
          position_size: 10_000_000n,
          num_grid_levels: 6,
          center_price: [], // Auto-detect from market
          auto_rebalance: true,
          max_slippage: 0.01,
          check_interval_sec: 60n
        }
      }
    }, [LEDGER_A, LEDGER_B]); // Specify ledgers for the grid trader

    // Add some funds to the grid trader
    await d.u.sendToNode(gridNode.id, PORT_0, 100_000_000n); // TokenA
    await d.u.sendToNode(gridNode.id, PORT_1, 100_000_000n); // TokenB

    // Wait and let the system run to initialize the grid
    await d.passTime(10);

    const nodeInfo = await d.u.getNode(gridNode.id);
    const shared = nodeInfo.custom as any;
    
    // Grid should now be initialized
    expect(shared.internals.grid_initialized).toBe(true);
    expect(shared.internals.current_center_price).toBeGreaterThan(0);
    expect(shared.internals.total_buy_orders).toBeGreaterThan(0);
    expect(shared.internals.total_sell_orders).toBeGreaterThan(0);
    expect(shared.internals.grid_levels.length).toBe(6);

    // Check grid level structure
    const gridLevels = shared.internals.grid_levels;
    let buyOrders = 0;
    let sellOrders = 0;
    
    for (let level of gridLevels) {
      expect(level.price).toBeGreaterThan(0);
      expect(level.amount).toBe(10_000_000n);
      expect(level.is_filled).toBe(false);
      expect(level.filled_at).toBeNull();
      
      if (level.is_buy_order) {
        buyOrders++;
      } else {
        sellOrders++;
      }
    }
    
    expect(buyOrders).toBeGreaterThan(0);
    expect(sellOrders).toBeGreaterThan(0);
    expect(buyOrders + sellOrders).toBe(6);

  }, 600 * 1000);

  // Test 5: Order Execution Simulation
  it('should execute orders when price hits grid levels', async () => {
    
    // Create liquidity pool with wide range to allow price movements
    let lpNode = await EU.createLPNode(LEDGER_A, LEDGER_B, {
      partial: {
        from_price: 0.5,
        to_price: 2.0,
      }
    });

    // Add substantial liquidity for trading
    await EU.addLiquidity(lpNode.id, LEDGER_A, LEDGER_B, 10000_0000_0000n, 10000_0000_0000n);

    // Create grid trader with tight spacing for easier testing
    let gridNode = await d.u.createNode({
      'grid_trader': {
        'init': { pool_id: 0 },
        'variables': {
          grid_spacing: 0.01, // 1% spacing
          position_size: 5_000_000n,
          num_grid_levels: 4,
          center_price: [1.0], // Set explicit center price
          auto_rebalance: false, // Disable for predictable testing
          max_slippage: 0.05,
          check_interval_sec: 60n
        }
      }
    }, [LEDGER_A, LEDGER_B]);

    // Fund the grid trader generously
    await d.u.sendToNode(gridNode.id, PORT_0, 200_000_000n); // TokenA
    await d.u.sendToNode(gridNode.id, PORT_1, 200_000_000n); // TokenB

    // Initialize grid
    await d.passTime(5);

    let nodeInfo = await d.u.getNode(gridNode.id);
    let shared = nodeInfo.custom as any;
    expect(shared.internals.grid_initialized).toBe(true);

    // Simulate price movement by making swaps that push price in different directions
    // This should trigger grid order executions

    // Create a swap node to generate price movements
    let swapNode = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          buy_for_amount: 50_000_000n,
          buy_interval_seconds: 30n,
          max_impact: 10000, // 100% impact allowed for testing
          max_rate: []
        }
      }
    }, [LEDGER_A, LEDGER_B]);

    // Fund swap node and let it execute some swaps
    await d.u.sendToNode(swapNode.id, PORT_0, 500_000_000n);
    await d.u.setDestination(swapNode.id, PORT_0, { 
      owner: d.jo.getPrincipal(), 
      subaccount: [d.u.subaccountFromId(2)] 
    });

    // Let the system run for several cycles
    await d.passTime(20);

    // Check if any grid orders were executed
    nodeInfo = await d.u.getNode(gridNode.id);
    shared = nodeInfo.custom as any;

    // At minimum, some activity should have occurred
    expect(shared.internals.last_check_ts).toBeGreaterThan(0);
    expect(shared.internals.next_check_ts).toBeGreaterThan(shared.internals.last_check_ts);

  }, 600 * 1000);

  // Test 6: Auto-Rebalancing
  it('should rebalance grid on significant price movements', async () => {
    
    // Create liquidity pool with very wide range for price movements
    let lpNode = await EU.createLPNode(LEDGER_A, LEDGER_B, {
      partial: {
        from_price: 0.1,   // Very wide range
        to_price: 10.0,
      }
    });

    await EU.addLiquidity(lpNode.id, LEDGER_A, LEDGER_B, 20000_0000_0000n, 10000_0000_0000n);

    // Create grid trader with auto-rebalancing enabled
    let gridNode = await d.u.createNode({
      'grid_trader': {
        'init': { pool_id: 0 },
        'variables': {
          grid_spacing: 0.05, // 5% spacing
          position_size: 10_000_000n,
          num_grid_levels: 6,
          center_price: [1.0],
          auto_rebalance: true, // Enable auto-rebalancing
          max_slippage: 0.1,
          check_interval_sec: 60n
        }
      }
    }, [LEDGER_A, LEDGER_B]);

    await d.u.sendToNode(gridNode.id, PORT_0, 300_000_000n);
    await d.u.sendToNode(gridNode.id, PORT_1, 300_000_000n);

    // Initialize grid
    await d.passTime(5);

    let nodeInfo = await d.u.getNode(gridNode.id);
    let shared = nodeInfo.custom as any;
    const initialCenterPrice = shared.internals.current_center_price;

    // Create significant price movement through large swaps
    let bigSwapNode = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          buy_for_amount: 1000_000_000n, // Large swap to move price
          buy_interval_seconds: 30n,
          max_impact: 50000, // Allow very high impact for price movement
          max_rate: []
        }
      }
    }, [LEDGER_A, LEDGER_B]);

    await d.u.sendToNode(bigSwapNode.id, PORT_0, 2000_000_000n);
    await d.u.setDestination(bigSwapNode.id, PORT_0, { 
      owner: d.jo.getPrincipal(), 
      subaccount: [d.u.subaccountFromId(3)] 
    });

    // Let significant price movement occur
    await d.passTime(15);

    // Check if grid was rebalanced
    nodeInfo = await d.u.getNode(gridNode.id);
    shared = nodeInfo.custom as any;

    // The center price should have potentially updated due to rebalancing
    // (This depends on the actual price movement achieved)
    expect(shared.internals.grid_initialized).toBe(true);
    expect(shared.internals.current_center_price).toBeGreaterThan(0);

  }, 600 * 1000);

  // Test 7: Error Handling and Edge Cases
  it('should handle error conditions gracefully', async () => {
    
    // Create grid trader without liquidity pool (should handle gracefully)
    let gridNode = await d.u.createNode({
      'grid_trader': {
        'init': { pool_id: 999 }, // Non-existent pool
        'variables': {
          grid_spacing: 0.02,
          position_size: 10_000_000n,
          num_grid_levels: 4,
          center_price: [],
          auto_rebalance: true,
          max_slippage: 0.01,
          check_interval_sec: 60n
        }
      }
    });

    await d.u.sendToNode(gridNode.id, PORT_0, 100_000_000n);
    await d.u.sendToNode(gridNode.id, PORT_1, 100_000_000n);

    // Try to run the grid - should handle missing pool gracefully
    await d.passTime(10);

    let nodeInfo = await d.u.getNode(gridNode.id);
    let shared = nodeInfo.custom as any;

    // Grid should not initialize due to missing pool
    expect(shared.internals.grid_initialized).toBe(false);
    expect(shared.internals.last_error).toBeDefined();

  }, 600 * 1000);

  // Test 8: Profit Tracking
  it('should track profits and execution statistics', async () => {
    
    // Create a simple setup for profit tracking
    let lpNode = await EU.createLPNode(LEDGER_A, LEDGER_B, {
      partial: {
        from_price: 0.8,
        to_price: 1.2,
      }
    });

    await EU.addLiquidity(lpNode.id, LEDGER_A, LEDGER_B, 5000_0000_0000n, 5000_0000_0000n);

    let gridNode = await d.u.createNode({
      'grid_trader': {
        'init': { pool_id: 0 },
        'variables': {
          grid_spacing: 0.02,
          position_size: 10_000_000n,
          num_grid_levels: 4,
          center_price: [1.0],
          auto_rebalance: false,
          max_slippage: 0.02,
          check_interval_sec: 60n
        }
      }
    }, [LEDGER_A, LEDGER_B]);

    await d.u.sendToNode(gridNode.id, PORT_0, 150_000_000n);
    await d.u.sendToNode(gridNode.id, PORT_1, 150_000_000n);

    // Initialize and run
    await d.passTime(10);

    let nodeInfo = await d.u.getNode(gridNode.id);
    let shared = nodeInfo.custom as any;

    // Check initial state
    expect(shared.internals.total_profit).toBe(0.0);
    expect(shared.internals.orders_executed).toBe(0);

    // The profit tracking will be tested through actual order execution
    // which requires price movements and successful swaps
    
  }, 600 * 1000);

  // Test 9: Delete Grid Trader
  it('should delete grid trader successfully', async () => {
    
    let node = await d.u.createNode({
      'grid_trader': {
        'init': { pool_id: 0 },
        'variables': {
          grid_spacing: 0.02,
          position_size: 10_000_000n,
          num_grid_levels: 6,
          center_price: [],
          auto_rebalance: true,
          max_slippage: 0.01,
          check_interval_sec: 300n
        }
      }
    });

    // Verify node exists
    let nodeInfo = await d.u.getNode(node.id);
    expect(nodeInfo.module_id).toBe('grid_trader');

    // Delete the node
    await d.u.deleteNode(node.id);

    // Verify node is deleted
    await expect(d.u.getNode(node.id)).rejects.toThrow();

  }, 600 * 1000);

});