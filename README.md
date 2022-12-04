# OOPgoose
A friendly abstraction layer allowing you to write OOP Typescript classes directly on top of Mongoose schemas for MongoDB.

### Quick Start

##### Install OOPgoose
```
yarn install @jovialis/oopgoose
```
or
```
npm install @jovialis/oopgoose
```

##### Create Document Definitions

Definitions are constructed of three components: the ```Document```, the ```Schema```, and the ```Builder```.

The Document is the primary OOP Object and can contain whatever complex logic you want in it.

The Schema is the interface type passed to Mongoose and defines the core data that will be loaded/save from the DB.

The Builder links the Document and Schema to the Mongoose Model and its Schema.

```typescript
// User.model.ts
import {DocumentClass, DocumentClassSchema, model} from "@jovialis/oopgoose";
import {Listing, ListingDocument} from "./listing";

export class UserDocument extends DocumentClass<IUser> {
	async getListings(): Promise<ListingDocument> {
		return await this.populate(Listing, "listings");
    }
	
	getCombinedIdentifier() {
		// The underlying document is accessible at this._doc
		return `${this._doc.name}|${this._doc.email}`
    }
	
	setEmail(email: string) {
		this._doc.email = email;
    }
}

export interface IUser extends DocumentClassSchema {
    name: string
    email: string
    listings: string[] // Mongoose reference
}

export const User = build(
	"User", // Name of the Mongoose model
    new mongoose.Schema<IUser>({
        name: String,
        email: String,
        listings: [{
			type: String,
            ref: 'Listing'
        }]
    }),
    UserDocument
);
```

Now, you can use the built `User` to query OOPgoose. Whatever queries you run, you'll get back a `UserDocument`.

```typescript
import {OG} from "@jovialis/oopgoose"
import {User} from "./models/User.model"

const existingUser = await OG.findOne(User, {
	email: "me@dyl.fyi"
});

// typeof existingUser == UserDocument

console.log(existingUser.getCombinedIdentifier());
```

OOPgoose wraps all of the core Mongoose operations. Each Document is responsible for modifying their underlying Mongoose Document's state, and they can be saved using:

```typescript
existingUser.setEmail("dylan@dyl.fyi");
existingUser.save().then(() => console.log("Success!"));
```

### Considerations

OOPgoose doesn't support most of Mongoose's cursoring methods meaning that it can potentially slow down significantly when returning/handling large operations.

In these circumstances, please consider accessing the underlying Mongoose models directly and making use of their cursoring functionality.

### NOTE

You MUST conduct your own use-case testing if you use this package. I'm using it primarily for my own internal applications, and I DO NOT take any responsibility for performance or security issues that arise as a result of it.