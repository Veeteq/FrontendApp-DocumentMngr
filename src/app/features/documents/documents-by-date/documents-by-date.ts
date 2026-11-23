import { Component, input, OnInit } from "@angular/core";

@Component({
  selector: 'app-documents-by-date',
  imports: [],
  styleUrl: 'documents-by-date.css',
  templateUrl: 'documents-by-date.html'
})
export class DocumentsByDate implements OnInit {
  readonly documentDate = input<string | null>();
  
  ngOnInit(): void {}

}