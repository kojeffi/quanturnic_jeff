use candid::{CandidType, Deserialize};
use ic_cdk::{api, update, query};
use ic_llm::{ChatMessage, Model};
use serde::Serialize;
use std::cell::RefCell;

// Data structures
#[derive(CandidType, Deserialize, Serialize, Clone)]
pub struct TradeSignal {
    timestamp: u64,
    pair: String,
    action: String, // "BUY" or "SELL"
    confidence: f32,
    price: f64,
}

#[derive(CandidType, Deserialize, Serialize, Clone)]
pub struct Trade {
    id: u64,
    signal: TradeSignal,
    executed: bool,
    profit_loss: Option<f64>,
    timestamp: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone)]
pub struct BotState {
    active: bool,
    balance: f64,
    last_analysis: Option<u64>,
    strategy: String,
    risk_level: f32,
}

thread_local! {
    static STATE: RefCell<BotState> = RefCell::new(BotState {
        active: false,
        balance: 0.0,
        last_analysis: None,
        strategy: "momentum".to_string(),
        risk_level: 0.5,
    });
    
    static TRADES: RefCell<Vec<Trade>> = RefCell::new(Vec::new());
    
    static SIGNALS: RefCell<Vec<TradeSignal>> = RefCell::new(Vec::new());
}

// AI Chat Functionality
#[update]
async fn prompt(prompt_str: String) -> String {
    ic_llm::prompt(Model::Llama3_1_8B, prompt_str).await
}

#[update]
async fn chat(messages: Vec<ChatMessage>) -> String {
    ic_llm::chat(Model::Llama3_1_8B, messages).await
}

// Trading Bot Functions
#[update]
async fn analyze_market(_data: String) -> Result<(), String> {
    // Simulate AI analysis (in a real implementation, this would process market data)
    let timestamp = api::time();
    
    // Generate mock signals (replace with actual analysis)
    let signals = vec![
        TradeSignal {
            timestamp,
            pair: "ICP/USD".to_string(),
            action: "BUY".to_string(),
            confidence: 0.75,
            price: 12.34,
        },
        TradeSignal {
            timestamp,
            pair: "BTC/USD".to_string(),
            action: "SELL".to_string(),
            confidence: 0.62,
            price: 42356.78,
        },
    ];
    
    SIGNALS.with(|s| {
        let mut signals_store = s.borrow_mut();
        signals_store.extend(signals);
    });
    
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        state.last_analysis = Some(timestamp);
    });
    
    Ok(())
}

#[update]
async fn execute_trades() -> Result<(), String> {
    STATE.with(|s| {
        let state = s.borrow();
        if !state.active {
            return Err("Bot is not active".to_string());
        }
        Ok(())
    })?;
    
    let signals_to_execute: Vec<TradeSignal> = SIGNALS.with(|s| {
        let signals = s.borrow();
        signals.iter()
            .filter(|sig| sig.confidence > 0.6) // Only execute high confidence signals
            .cloned()
            .collect()
    });
    
    let timestamp = api::time();
    let mut new_trades = Vec::new();
    
    for (i, signal) in signals_to_execute.into_iter().enumerate() {
        // In a real implementation, this would interact with a DEX
        let trade = Trade {
            id: timestamp + i as u64,
            signal: signal.clone(),
            executed: true,
            profit_loss: None, // Will be updated later
            timestamp,
        };
        
        new_trades.push(trade);
    }
    
    TRADES.with(|t| {
        let mut trades = t.borrow_mut();
        trades.extend(new_trades);
    });
    
    Ok(())
}

// Query Functions
#[query]
fn get_bot_state() -> BotState {
    STATE.with(|s| s.borrow().clone())
}

#[query]
fn get_trade_history() -> Vec<Trade> {
    TRADES.with(|t| t.borrow().clone())
}

#[query]
fn get_signals() -> Vec<TradeSignal> {
    SIGNALS.with(|s| s.borrow().clone())
}

// Bot Control Functions
#[update]
fn toggle_bot(active: bool) -> BotState {
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        state.active = active;
        state.clone()
    })
}

#[update]
fn update_strategy(strategy: String, risk_level: f32) -> BotState {
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        state.strategy = strategy;
        state.risk_level = risk_level;
        state.clone()
    })
}

ic_cdk::export_candid!();