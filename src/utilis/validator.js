const validator=require("validator");

function validateUser(data){

    const mandatoryField=["email","name","password"];

    const IsAllowed=mandatoryField.every((key)=>Object.keys(data).includes(key));

    if(!IsAllowed)
        throw new Error("Field Missing");

    if(!validator.isEmail(data.email))
        throw new Error("Invalid Email");

    if(!validator.isStrongPassword(data.password))
        throw new Error("Weak Password");

    if(!(data.name.length>=6))
        throw new Error("FirstName should have atleast 3 character and atmost 20 character");
    //password validation
    //firstname>3 and <20

}

module.exports=validateUser;