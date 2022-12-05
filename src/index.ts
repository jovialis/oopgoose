/**
 * index
 * Project: dylgoose
 * Author: jovialis (Dylan Hanson)
 * Date: 12/4/22
 */

import {DeleteResult, UpdateResult} from "mongodb";
import {
	FilterQuery,
	HydratedDocument,
	model as mongoModel,
	Model,
	modelNames,
	ObjectId,
	PopulateOptions,
	ProjectionType,
	QueryOptions,
	SaveOptions,
	Schema,
	UpdateQuery,
} from "mongoose";

export type ID = string | ObjectId

export interface DocumentClassSchema {
	_id?: ID
}

export type RequiredID<T> = T & { _id: ID }

export abstract class DocumentClass<I extends DocumentClassSchema> {
	public _doc: HydratedDocument<I>

	constructor(_doc: HydratedDocument<I, {}, {}>) {
		this._doc = _doc;
	}

	public getID(): ID {
		return this._doc._id;
	}

	public save(options?: SaveOptions) {
		return this._doc.save(options);
	}

	public isModified(path?: string | string[]) {
		return this._doc.isModified(path);
	}

	public isNew() {
		return this._doc.isNew;
	}

	public async populate<I extends DocumentClassSchema, D extends DocumentClass<I>>(docClass: DocClassBuilder<I, D>, path: string, options?: PopulateOptions): Promise<any> {
		if (!this._doc.populated(path)) {
			if (options) {
				options.path = path;
				await this._doc.populate(options);
			} else {
				await this._doc.populate(path);
			}
		}
		return _instantiate(docClass, this._doc.get(path))
	}

	public toJSON(): any {
		return this._doc.toJSON();
	}

	public __isDocumentClass__() {
		return true;
	}
}

export function isDocumentClass<I extends DocumentClassSchema>(obj: any): obj is DocumentClass<I> {
	return (<DocumentClass<I>>obj).__isDocumentClass__ !== undefined;
}

let modelList: { [modelName: string]: DocClassBuilder<any, any> } = {};

/**
 * Generates a Document Class Builder that can be used in DB operations
 * @param modelName
 * @param schema
 * @param instantiator
 */
export function model<I extends DocumentClassSchema, D extends DocumentClass<I>>(
	modelName: string,
	schema: Schema<I>,
	instantiator: DocumentClassInstantiator<I, D>
): DocClassBuilder<I, D> {
	// Cast the instantiator and add the schema and modelName fields
	let castedInstantiator = <DocClassBuilder<I, D>>(instantiator);
	castedInstantiator._schema = schema;
	castedInstantiator._modelName = modelName;
	castedInstantiator.Model = _model(modelName, schema);
	modelList[modelName] = castedInstantiator;
	return castedInstantiator;
}

export function getDocumentBuilder(modelName: string): DocClassBuilder<any, any> | undefined {
	return modelList[modelName];
}

interface DocumentClassInstantiator<I extends DocumentClassSchema, D extends DocumentClass<I>> {
	new(_doc: HydratedDocument<I>): D
}

export interface CreateOptions {
	local?: boolean
}

export interface DocClassBuilder<I extends DocumentClassSchema, D extends DocumentClass<I>> extends DocumentClassInstantiator<I, D> {
	_schema: Schema<I>
	_modelName: string
	Model: Model<I>
}

function _instantiate<I extends DocumentClassSchema, D extends DocumentClass<I>>(docClass: DocClassBuilder<I, D>, doc: HydratedDocument<I, {}, {}>): D {
	return new docClass(doc);
}

function _model<I>(modelName: string, schema: Schema<I>): Model<I, {}, {}> {
	if (modelNames().includes(modelName)) {
		return mongoModel<I>(modelName)
	} else {
		return mongoModel<I>(modelName, schema);
	}
}

export namespace OG {

	export async function find<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		filter: FilterQuery<I>,
		projection?: ProjectionType<I>,
		options?: QueryOptions<I>
	): Promise<D[]> {
		const res = await docClass.Model.find(filter, projection, options)
		return res.map((val: HydratedDocument<I>) => _instantiate(docClass, val));
	}

	export async function findOne<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		filter: FilterQuery<I>,
		projection?: ProjectionType<I>,
		options?: QueryOptions<I>
	): Promise<D> {
		const res = await docClass.Model.findOne(filter, projection, options);
		// @ts-ignore
		return _instantiate(docClass, res);
	}

	export async function findByID<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		id: ID,
		projection?: ProjectionType<I>,
		options?: QueryOptions<I>
	): Promise<D> {
		const res = await docClass.Model.findById(id, projection, options);
		// @ts-ignore
		return _instantiate(docClass, res);
	}

	export async function deleteOne<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		filter?: FilterQuery<I>,
		options?: QueryOptions<I>
	): Promise<DeleteResult> {
		return docClass.Model.deleteOne(filter, options);
	}

	export async function deleteMany<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		filter?: FilterQuery<I>,
		options?: QueryOptions<I>
	): Promise<DeleteResult> {
		return docClass.Model.deleteMany(filter, options);
	}

	export async function updateOne<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		filter?: FilterQuery<I>,
		update?: UpdateQuery<I>,
		options?: QueryOptions<I>
	): Promise<UpdateResult> {
		return docClass.Model.updateOne(filter, update, options);
	}

	export async function updateMany<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		filter?: FilterQuery<I>,
		update?: UpdateQuery<I>,
		options?: QueryOptions<I>
	): Promise<UpdateResult> {
		return docClass.Model.updateMany(filter, update, options);
	}

	export async function findOneAndUpdate<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		filter?: FilterQuery<I>,
		update?: UpdateQuery<I>,
		options?: QueryOptions<I>
	) {
		const res = await docClass.Model.findOneAndUpdate(filter, update, options);
		// @ts-ignore
		return _instantiate(docClass, res);
	}

	export async function findOneAndDelete<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		filter?: FilterQuery<I>,
		options?: QueryOptions<I>
	) {
		const res = await docClass.Model.findOneAndDelete(filter, options);
		// @ts-ignore
		return _instantiate(docClass, res);
	}

	export async function findOneAndReplace<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		filter?: FilterQuery<I>,
		replacement?: I | D,
		options?: QueryOptions<I>
	) {
		let res;
		if (isDocumentClass(replacement)) {
			res = await docClass.Model.findOneAndReplace(filter, replacement._doc, options);
		} else {
			res = await docClass.Model.findOneAndReplace(filter, replacement, options);
		}
		// @ts-ignore
		return _instantiate(docClass, res);
	}

	export async function findOneAndRemove<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		filter?: FilterQuery<I>,
		options?: QueryOptions<I>
	) {
		const res = await docClass.Model.findOneAndRemove(filter, options);
		// @ts-ignore
		return _instantiate(docClass, res);
	}

	export async function findByIDAndUpdate<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		id: ID,
		update?: UpdateQuery<I>,
		options?: QueryOptions<I>
	) {
		const res = await docClass.Model.findByIdAndUpdate(id, update, options);
		// @ts-ignore
		return _instantiate(docClass, res);
	}

	export async function findByIDAndDelete<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		id: ID,
		options?: QueryOptions<I>
	) {
		const res = await docClass.Model.findByIdAndDelete(id, options);
		// @ts-ignore
		return _instantiate(docClass, res);
	}

	export async function findByIDAndRemove<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		id: ID,
		options?: QueryOptions<I>
	) {
		const res = await docClass.Model.findByIdAndRemove(id, options);
		// @ts-ignore
		return _instantiate(docClass, res);
	}

	export async function createOne<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		doc: Partial<I>,
		options?: CreateOptions
	) {
		if (options && options.local) {
			const instance: HydratedDocument<I, {}, {}> = <HydratedDocument<I, {}, {}>>new docClass.Model(doc);
			return _instantiate(docClass, instance);
		} else {
			const res = await docClass.Model.create(doc);
			return _instantiate(docClass, res);
		}
	}

	export async function createMany<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		docs: Partial<I>[],
		options?: CreateOptions & SaveOptions
	) {
		if (options && options.local) {
			const instances = docs.map(d => <HydratedDocument<I, {}, {}>>new docClass.Model(d));
			return instances.map(i => _instantiate(docClass, i));
		} else {
			const res = await docClass.Model.create(docs, options);
			return res.map(r => _instantiate(docClass, r));
		}
	}

	export async function countDocuments<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		filter: FilterQuery<I>,
		options?: QueryOptions<I>
	) {
		return docClass.Model.countDocuments(filter, options);
	}

	export async function exists<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		filter: FilterQuery<I>
	) {
		return docClass.Model.exists(filter);
	}

	export async function existsByID<I extends DocumentClassSchema, D extends DocumentClass<I>>(
		docClass: DocClassBuilder<I, D>,
		id: ID
	) {
		return docClass.Model.exists({
			_id: id
		});
	}
}
