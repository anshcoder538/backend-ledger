const transactionModel=require("../models/transaction.model");
const ledgerModel=require("../models/ledger.model");
const emailService=require("../services/email.service");
const accountModel=require("../models/account.model");
const mongoose=require("mongoose");

//THE 10 STEPS TRANSFER FLOW
//1->Validate Request
//2->Validate idempotency key
//3->Check account status
//4->Derive sender balance from ledger
//5->Create transaction(Pending)
//6->Create Debit ledger entry
//7->Create credit ledger entry
//8->Mark transaction COMPLETED
//9->Commit MongoDB session
//10->Send email notification

async function createTransaction(req,res){

    //1->VALIDATE REQUEST
    const {fromAccount,toAccount,amount,idempotencyKey}=req.body;
    if(!fromAccount||!toAccount||!amount||!idempotencyKey){
        return res.status(400).json({
            message:"Field missing"
        })
    }

    const fromUserAccount=await accountModel.findOne({
        _id:fromAccount,
        user:req.user._id
    })
    if(!fromUserAccount){
        return res.status(400).json({
            message:"UnAuthorised Access"
        })
    }

    const toUserAccount=await accountModel.findOne({
        _id:toAccount
    })

    if(!toUserAccount){
        return res.status(400).json({
            message:"Invalid fromAccount or toAccount"
        })
    }

    let transaction
    try{

    //2->Validate IKEY
    const isTransactionAlreadyExist=await transactionModel.findOne({
        idempotencyKey:idempotencyKey
    })
    if(isTransactionAlreadyExist){
        if(isTransactionAlreadyExist.status==="COMPLETED"){
            return res.status(200).json({
                message:"Transaction Already Processed"
            })
        }
        if(isTransactionAlreadyExist.status==="PENDING"){
           return res.status(200).json({
                message:"TRANSACCTION IS IN PENDING STATE"
            })
        }
        if(isTransactionAlreadyExist.status==="FAILED"){
           return res.status(500).json({
                message:"Transaction failed"
            })
        }
        if(isTransactionAlreadyExist.status==="REVERSED"){
           return res.status(200).json({
                message:"Transaction is reversed,retry"
            })
        }
    }

    //3->CHECKING ACCOUNT STATUS
    if(fromUserAccount.status!=="ACTIVE"||toUserAccount.status!=="ACTIVE"){
       return res.status(400).json({
        message:"Both Account must be active to process the transaction"
       })
    }

    //4->DERIVING SENDER BALANCE FROM LEDGER
    const balance=await fromUserAccount.getBalance()
    if(balance<amount){
        return res.status(400).json({
            message:`Insufficient Balance.Current Balance=${balance}`
        })
    }

    //5->create transaction
    const session=await mongoose.startSession()
    try{
        session.startTransaction() //ye hume allow karega ya fir saare [5--8] tak ho jaye warna ek bhi na ho

        transaction=(await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status:"PENDING"
        }],{session}))[0]

        const debitLedgerEntry=await ledgerModel.create([{
            account:fromAccount,
            amount:amount,
            transaction:transaction._id,
            type:"DEBIT"
        }],{session})


        const creditLedgerEntry=await ledgerModel.create([{
            account:toAccount,
            amount:amount,
            transaction:transaction._id,
            type:"CREDIT"
        }],{session})


        await transactionModel.findOneAndUpdate(
            {_id:transaction._id},
            {status:"COMPLETED"},
            {session}
        )
        await session.commitTransaction()
    }
    catch(err){
        await session.abortTransaction();
        throw err
    }finally{
        await session.endSession()
    }

    }catch(err){
        return res.status(400).json({
            message:"Transaction is pending pls retry after some time"
        })
    }

    //10->SEND COMPLETION EMAIL
    await emailService.sendTransactionEmail(req.user.email,req.user.name,amount,toAccount)
    
    return res.status(201).json({
        message:"Transaction successful",
        transaction:transaction
    })
}

async function createInitialFund(req,res){
    const {toAccount,amount,idempotencyKey}=req.body;
    if(!toAccount||!amount||!idempotencyKey){
        return res.status(400).json({
            message:"Field missing"
        })
    }
    const toUserAccount=await accountModel.findOne({
        _id:toAccount
    })
    console.log(toUserAccount)
    if(!toUserAccount){
        return res.status(400).json({
            message:"Invalid Account"
        })
    }
    const fromUserAccount=await accountModel.findOne({

        user:req.user._id
    })

    if(!fromUserAccount){
        return res.status(400).json({
            message:"System User account not found"
        })
    }

    const session=await mongoose.startSession()
    session.startTransaction()

    const transaction=new transactionModel({
        fromAccount:fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status:"PENDING"
    })

    const debitLedgerEntry=await ledgerModel.create([{
        account:fromUserAccount._id,
        amount:amount,
        transaction:transaction._id,
        type:"DEBIT"
    }],{session})

    const creditLedgerEntry=await ledgerModel.create([{
        account:toAccount,
        amount:amount,
        transaction:transaction._id,
        type:"CREDIT"
    }],{session})

    transaction.status="COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message:"INITIAL FUNDS TRANSACTION COMPLETED SUCCESSFULLY",
        transaction:transaction
    })
}

module.exports={createTransaction,createInitialFund}
