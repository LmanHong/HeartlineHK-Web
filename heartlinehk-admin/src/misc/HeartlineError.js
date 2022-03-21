export class HeartlineDuplicatedExecutionError extends Error {
    constructor(message="Duplicated Execution of function/process!"){
        super(message);
        this.name = "HeartlineDuplicatedExecutionError";
    }
}

export class HeartlineNotReadyError extends Error {
    constructor(message="Not Ready!"){
        super(message);
        this.name = "HeartlineNotReadyError";
    }
}

export class HeartlineNotFoundError extends Error{
    constructor(message="Not Found!"){
        super(message);
        this.name = "HeartlineNotFoundError";
    }
}

export class HeartlineAlreadyExistError extends Error{
    constructor(message="Already Exist!"){
        super(message);
        this.name = "HeartlineAlreadyExistError";
    }
}

export class HeartlineValidationError extends Error{
    constructor(message="Invalid!"){
        super(message);
        this.name = "HeartlineValidationError";
    }
}

export class HeartlineNotModifiedError extends Error{
    constructor(message="Not Modified!"){
        super(message);
        this.name = "HeartlineNotModifiedError";
    }
}