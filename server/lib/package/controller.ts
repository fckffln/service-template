import path from "path";
import { Directory } from "@lib/package/directory";
import { Package } from "@lib/package/package";
import fs from 'fs';

export class Controller {
    private static exec(command: string, args: string[] = [], workDir: string = '.'): boolean | null {
        const cmd = `${command} ${args.join(' ')}`;
        const res = Bun.spawnSync(['sh', '-c', cmd], { cwd: workDir });

        if (!res.success) {
            console.error(`Ошибка при выполнении команды: ${cmd}\n${Buffer.from(res.stderr).toString()}`);
            return null;
        }
        return res.success;
    }

    static from(_pack = './out.tar', _out = './out', force = false): Directory | null {
        const pack = path.resolve(_pack);
        const out = path.resolve(_out);
        if (force && fs.existsSync(out)) { // @ts-ignore
            fs.rmdirSync(out, {recursive: true, force: true});
        }
        if (!fs.existsSync(pack)) {
            console.error(`Файл архива ${pack} не найден.`);
            return null;
        }
        const ext = path.extname(pack);
        let command;

        if (ext === '.tar') {
            command = `tar -xf ${pack} -C ${out}`;
        } else if (ext === '.zip') {
            // Добавляем опцию -o для автоматической перезаписи существующих файлов
            command = `unzip -o ${pack} -d ${out}`;
        } else {
            console.error("Неподдерживаемый формат файла");
            return null;
        }

        const res = this.exec(command, []);
        return res ? new Directory(out) : null;
    }

    static to(_dir = './', _out = './out.tar', force = false): Package | null {
        const dir = path.resolve(_dir);
        const out = path.resolve(_out);
        if (force && fs.existsSync(out)) fs.rmSync(out);
        if (!fs.existsSync(dir)) {
            console.error(`Директория ${dir} не найдена.`);
            return null;
        }

        const ext = path.extname(out);
        let command;

        // Определяем имя выходного файла
        const outFileName = path.basename(out);

        if (ext === '.tar') {
            // Создание tar архива с содержимым этой директории
            command = `cd ${dir} && tar -czf ${out} .`;
        } else if (ext === '.zip') {
            // Создание zip архива с содержимым этой директории
            command = `cd ${dir} && zip -r ${out} .`;
        } else {
            console.error("Неподдерживаемый формат файла");
            return null;
        }

        // Выполняем команду из директории dir
        const res = this.exec(command, []);
        return res ? new Package(out) : null;
    }
}
